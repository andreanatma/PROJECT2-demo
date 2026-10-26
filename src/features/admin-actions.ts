"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { destroyUserSessions, requireSuperAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { deleteMediaIfUnused, mediaUsage, saveUpload } from "@/lib/media";
import { generateTempPassword, hashPassword, passwordSchema } from "@/lib/password";
import { SETTING_FIELDS } from "@/lib/settings-fields";
import { PAGE_KEYS } from "@/lib/seo";
import type { FormState } from "./crud-actions";

const toErrors = (e: z.ZodError) => {
  const errors: Record<string, string> = {};
  for (const i of e.issues) errors[String(i.path[0])] = i.message;
  return errors;
};
const back = (path: string, msg: string): never => redirect(`${path}?msg=${encodeURIComponent(msg)}`);

/* ---------------- Users ---------------- */
async function activeSuperAdminCount() {
  return prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
}

const userSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(190),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  isActive: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export async function createUser(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const parsed = userSchema.extend({ password: passwordSchema }).safeParse({ ...Object.fromEntries(fd), isActive: "true" });
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian.", errors: toErrors(parsed.error) };
  const { password, isActive, ...rest } = parsed.data;
  if (await prisma.user.findUnique({ where: { email: rest.email } })) return { ok: false, errors: { email: "Email sudah terdaftar" }, message: "Email sudah terdaftar." };
  const u = await prisma.user.create({ data: { ...rest, isActive, passwordHash: await hashPassword(password) } });
  await logActivity({ userId: me.id, action: "CREATE", entity: "users", entityId: u.id, summary: `Menambah administrator ${u.email} (${u.role})` });
  revalidatePath("/dashboard-admin/users");
  return back("/dashboard-admin/users", "Tersimpan: administrator berhasil ditambahkan.");
}

export async function updateUser(id: number, _p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const parsed = userSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, message: "Periksa kembali isian.", errors: toErrors(parsed.error) };
  const d = parsed.data;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, message: "Pengguna tidak ditemukan." };
  const demoting = target.role === "SUPER_ADMIN" && target.isActive && (d.role !== "SUPER_ADMIN" || !d.isActive);
  if (demoting && (await activeSuperAdminCount()) <= 1) return { ok: false, message: "Tidak dapat mengubah atau menonaktifkan Super Admin aktif terakhir." };
  if (me.id === id && !d.isActive) return { ok: false, message: "Anda tidak dapat menonaktifkan akun sendiri." };
  const dup = await prisma.user.findFirst({ where: { email: d.email, NOT: { id } } });
  if (dup) return { ok: false, errors: { email: "Email sudah dipakai" }, message: "Email sudah dipakai." };
  await prisma.user.update({ where: { id }, data: d });
  if (!d.isActive || d.role !== target.role) await destroyUserSessions(id);
  if (d.role !== target.role) await logActivity({ userId: me.id, action: "ROLE_CHANGE", entity: "users", entityId: id, summary: `Role ${target.email}: ${target.role} → ${d.role}` });
  await logActivity({ userId: me.id, action: "UPDATE", entity: "users", entityId: id, summary: `Memperbarui pengguna ${d.email}${d.isActive ? "" : " (dinonaktifkan)"}` });
  revalidatePath("/dashboard-admin/users");
  return back("/dashboard-admin/users", "Tersimpan: pengguna berhasil diperbarui.");
}

export async function deleteUser(id: number): Promise<void> {
  const me = await requireSuperAdmin();
  const t = await prisma.user.findUnique({ where: { id } });
  if (!t) return back("/dashboard-admin/users", "Pengguna tidak ditemukan.");
  if (t.id === me.id) return back("/dashboard-admin/users", "Anda tidak dapat menghapus akun sendiri.");
  if (t.role === "SUPER_ADMIN" && t.isActive && (await activeSuperAdminCount()) <= 1) return back("/dashboard-admin/users", "Tidak dapat menghapus Super Admin aktif terakhir.");
  await prisma.user.delete({ where: { id } });
  await logActivity({ userId: me.id, action: "DELETE", entity: "users", entityId: id, summary: `Menghapus pengguna ${t.email}` });
  return back("/dashboard-admin/users", "Terhapus: pengguna berhasil dihapus.");
}

export async function resetUserPassword(id: number): Promise<void> {
  const me = await requireSuperAdmin();
  const t = await prisma.user.findUnique({ where: { id } });
  if (!t) return back("/dashboard-admin/users", "Pengguna tidak ditemukan.");
  const temp = generateTempPassword();
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(temp) } });
  await destroyUserSessions(id);
  await logActivity({ userId: me.id, action: "PASSWORD", entity: "users", entityId: id, summary: `Reset kata sandi ${t.email}` });
  // Kata sandi sementara ditampilkan sekali lewat cookie flash bukan URL/log.
  const { cookies } = await import("next/headers");
  (await cookies()).set("apex_flash_pw", `${t.email}|${temp}`, { httpOnly: true, sameSite: "lax", path: "/dashboard-admin/users", maxAge: 60, secure: process.env.NODE_ENV === "production" });
  redirect("/dashboard-admin/users");
}

/* ---------------- Contact ---------------- */
export async function setMessageStatus(id: number, status: "UNREAD" | "READ" | "REPLIED"): Promise<void> {
  const me = await requireUser();
  await prisma.contactMessage.update({ where: { id }, data: { status } });
  await logActivity({ userId: me.id, action: "UPDATE", entity: "contact", entityId: id, summary: `Status pesan #${id} → ${status}` });
  revalidatePath("/dashboard-admin/contact");
  revalidatePath("/dashboard-admin");
  redirect(`/dashboard-admin/contact/${id}?msg=${encodeURIComponent("Status pesan diperbarui.")}`);
}

export async function deleteMessage(id: number): Promise<void> {
  const me = await requireUser();
  await prisma.contactMessage.delete({ where: { id } }).catch(() => undefined);
  await logActivity({ userId: me.id, action: "DELETE", entity: "contact", entityId: id, summary: `Menghapus pesan #${id}` });
  revalidatePath("/dashboard-admin");
  return back("/dashboard-admin/contact", "Terhapus: pesan berhasil dihapus.");
}

/* ---------------- Settings & SEO ---------------- */
export async function saveSettings(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of SETTING_FIELDS) shape[f.key] = z.string().trim().max(1000);
  const parsed = z.object(shape).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, message: "Isian tidak valid.", errors: toErrors(parsed.error) };
  const entries = Object.entries(parsed.data as Record<string, string>);
  await prisma.$transaction(entries.map(([key, value]) => prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })));
  await logActivity({ userId: me.id, action: "SETTINGS", entity: "settings", summary: `Memperbarui pengaturan situs (${entries.length} kolom)` });
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan tersimpan." };
}

export async function saveSeo(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const items = PAGE_KEYS.map((p) => ({
    pageKey: p.key as string,
    title: String(fd.get(`${p.key}__title`) ?? "").trim().slice(0, 160) || null,
    description: String(fd.get(`${p.key}__description`) ?? "").trim().slice(0, 320) || null,
    ogImageId: Number(fd.get(`${p.key}__ogImageId`)) || null,
    noindex: fd.get(`${p.key}__noindex`) === "on",
  }));
  const before = await prisma.seoSetting.findMany();
  await prisma.$transaction(items.map((i) => prisma.seoSetting.upsert({ where: { pageKey: i.pageKey }, update: i, create: i })));
  for (const b of before) {
    const n = items.find((i) => i.pageKey === b.pageKey);
    if (b.ogImageId && n?.ogImageId !== b.ogImageId) await deleteMediaIfUnused(b.ogImageId);
  }
  await logActivity({ userId: me.id, action: "SETTINGS", entity: "seo", summary: "Memperbarui pengaturan SEO halaman" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Pengaturan SEO tersimpan." };
}

/* ---------------- Media library ---------------- */
export async function uploadToLibrary(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const file = fd.get("file");
  if (!(file instanceof File)) return { ok: false, message: "File belum dipilih." };
  const isPublic = fd.get("visibility") !== "private";
  const r = await saveUpload(file, { accept: ["image", "pdf"], isPublic, userId: me.id });
  if (!r.ok) return { ok: false, message: r.error };
  await logActivity({ userId: me.id, action: "UPLOAD", entity: "media", entityId: r.id, summary: `Mengunggah ${r.name} ke media library (${isPublic ? "publik" : "privat"})` });
  revalidatePath("/dashboard-admin/media");
  return { ok: true, message: `Berhasil mengunggah ${r.name}.` };
}

export async function deleteMediaItem(id: number): Promise<void> {
  const me = await requireUser();
  if ((await mediaUsage(id)) > 0) return back("/dashboard-admin/media", "File masih dipakai konten dan tidak dapat dihapus.");
  await deleteMediaIfUnused(id);
  await logActivity({ userId: me.id, action: "DELETE", entity: "media", entityId: id, summary: `Menghapus file media #${id}` });
  return back("/dashboard-admin/media", "Terhapus: file berhasil dihapus.");
}

export async function toggleMediaVisibility(id: number): Promise<void> {
  const me = await requireUser();
  const m = await prisma.mediaFile.findUnique({ where: { id } });
  if (!m) return back("/dashboard-admin/media", "File tidak ditemukan.");
  await prisma.mediaFile.update({ where: { id }, data: { isPublic: !m.isPublic } });
  await logActivity({ userId: me.id, action: "UPDATE", entity: "media", entityId: id, summary: `Visibilitas file #${id} → ${m.isPublic ? "privat" : "publik"}` });
  return back("/dashboard-admin/media", "Visibilitas file diperbarui.");
}
