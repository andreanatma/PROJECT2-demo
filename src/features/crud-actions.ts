"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { deleteMediaIfUnused, saveUpload } from "@/lib/media";
import { slugify } from "@/lib/utils";
import { getModule, type FieldDef, type ModuleDef } from "./modules";

export type FormState = { ok: boolean; message?: string; errors?: Record<string, string> };

// Akses delegate Prisma secara dinamis hanya di satu tempat ini.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (m: ModuleDef): any => (prisma as any)[m.model];

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  const req = f.required ? `${f.label} wajib diisi` : undefined;
  switch (f.type) {
    case "text": case "textarea": case "longtext": case "slug": {
      let s = z.string().trim();
      if (f.max) s = s.max(f.max, `${f.label} maksimal ${f.max} karakter`);
      if (f.required) s = s.min(1, req);
      return f.required ? s : s.transform((v) => (v === "" ? null : v));
    }
    case "number":
      return z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number({ invalid_type_error: `${f.label} harus berupa angka` }).int().min(0).max(100000));
    case "date":
      return z.preprocess((v) => (v === "" || v == null ? null : new Date(String(v))), z.date({ invalid_type_error: "Tanggal tidak valid" }).nullable());
    case "select":
      return z.enum((f.options ?? []).map((o) => o.value) as [string, ...string[]], { errorMap: () => ({ message: `${f.label} tidak valid` }) });
    case "image": case "pdf": {
      const base = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable());
      return f.required ? base.refine((v) => v !== null, req) : base;
    }
  }
}

function parse(m: ModuleDef, fd: FormData) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of m.fields) shape[f.name] = fieldSchema(f);
  const raw: Record<string, unknown> = {};
  for (const f of m.fields) raw[f.name] = fd.get(f.name) ?? "";
  return z.object(shape).safeParse(raw);
}

async function uniqueSlug(m: ModuleDef, base: string, selfId: number | null): Promise<string> {
  const root = slugify(base) || "item";
  let slug = root;
  for (let i = 2; i < 200; i++) {
    const found = await db(m).findUnique({ where: { slug } });
    if (!found || found.id === selfId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

function revalidate(m: ModuleDef) {
  for (const p of m.publicPaths) revalidatePath(p);
  revalidatePath("/dashboard-admin");
}

export async function saveEntity(moduleKey: string, id: number | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const m = getModule(moduleKey);
  if (!m) return { ok: false, message: "Modul tidak ditemukan." };

  const parsed = parse(m, fd);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return { ok: false, message: "Periksa kembali isian formulir.", errors };
  }
  const data = { ...(parsed.data as Record<string, unknown>) };

  if (m.slugSource) data.slug = await uniqueSlug(m, String(data.slug || data[m.slugSource] || ""), id);
  if (m.model === "blog") {
    if (data.status === "PUBLISHED" && !data.publishedAt) data.publishedAt = new Date();
    if (data.status === "DRAFT" && !fd.get("publishedAt")) data.publishedAt = null;
  }

  let before: Record<string, unknown> | null = null;
  try {
    if (id) {
      before = await db(m).findUnique({ where: { id } });
      if (!before) return { ok: false, message: "Data tidak ditemukan atau sudah dihapus." };
      await db(m).update({ where: { id }, data });
    } else {
      const created = await db(m).create({ data });
      id = created.id as number;
      await logActivity({ userId: user.id, action: "CREATE", entity: m.key, entityId: id, summary: `Membuat ${m.singular} "${String(data[m.nameField])}"` });
    }
  } catch (e) {
    console.error("saveEntity", e);
    return { ok: false, message: "Gagal menyimpan data. Slug mungkin sudah dipakai atau terjadi kesalahan database." };
  }

  if (before) {
    const changed = Object.keys(data).filter((k) => String(before![k] ?? "") !== String(data[k] ?? ""));
    await logActivity({ userId: user.id, action: "UPDATE", entity: m.key, entityId: id, summary: `Memperbarui ${m.singular} "${String(data[m.nameField])}" (kolom: ${changed.join(", ") || "tidak ada perubahan"})` });
    // Bersihkan media lama yang tidak lagi dipakai
    for (const mf of m.mediaFields) {
      const old = before[mf] as number | null;
      if (old && old !== data[mf]) await deleteMediaIfUnused(old);
    }
  }
  revalidate(m);
  redirect(`/dashboard-admin/${m.key}?msg=${encodeURIComponent(`Tersimpan: ${m.singular} berhasil disimpan.`)}`);
}

export async function deleteEntity(moduleKey: string, id: number): Promise<void> {
  const user = await requireUser();
  const m = getModule(moduleKey);
  if (!m) redirect("/dashboard-admin");
  const row = await db(m).findUnique({ where: { id } });
  if (!row) redirect(`/dashboard-admin/${m.key}?msg=${encodeURIComponent("Data tidak ditemukan.")}`);
  await db(m).delete({ where: { id } });
  for (const mf of m.mediaFields) await deleteMediaIfUnused(row[mf] as number | null);
  await logActivity({ userId: user.id, action: "DELETE", entity: m.key, entityId: id, summary: `Menghapus ${m.singular} "${String(row[m.nameField])}"` });
  revalidate(m);
  redirect(`/dashboard-admin/${m.key}?msg=${encodeURIComponent(`Terhapus: ${m.singular} berhasil dihapus.`)}`);
}

export type UploadState = { ok: boolean; id?: number; url?: string; name?: string; size?: number; mime?: string; error?: string };

export async function uploadMedia(accept: "image" | "pdf", isPublic: boolean, fd: FormData): Promise<UploadState> {
  const user = await requireUser();
  const file = fd.get("file");
  if (!(file instanceof File)) return { ok: false, error: "File belum dipilih." };
  try {
    const r = await saveUpload(file, { accept: [accept], isPublic, userId: user.id });
    if (!r.ok) return { ok: false, error: r.error };
    await logActivity({ userId: user.id, action: "UPLOAD", entity: "media", entityId: r.id, summary: `Mengunggah ${r.name} (${r.mime}, ${r.size} B)` });
    return { ok: true, id: r.id, url: r.url, name: r.name, size: r.size, mime: r.mime };
  } catch (e) {
    console.error("upload", e);
    return { ok: false, error: "Gagal menyimpan file di server." };
  }
}
