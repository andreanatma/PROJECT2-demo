"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, getClientIp, getSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { hashPassword, passwordSchema, safeEqual, verifyPassword } from "@/lib/password";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import type { FormState } from "./crud-actions";

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(190), password: z.string().min(1).max(128) });

export async function loginAction(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { ok: false, message: "Email atau kata sandi tidak valid." };
  const { email, password } = parsed.data;
  const ip = await getClientIp();
  const key = `login:${ip}:${email}`;
  const rl = rateLimit(key, 5, 15 * 60_000);
  if (!rl.ok) return { ok: false, message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSec / 60)} menit.` };

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid || !user.isActive) {
    await logActivity({ userId: user?.id ?? null, action: "LOGIN_FAILED", entity: "auth", summary: "Percobaan login gagal" });
    return { ok: false, message: "Email atau kata sandi salah, atau akun dinonaktifkan." };
  }
  resetRateLimit(key);
  await createSession(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logActivity({ userId: user.id, action: "LOGIN", entity: "auth", summary: "Login berhasil" });
  redirect("/dashboard-admin");
}

export async function logoutAction(): Promise<void> {
  const u = await getSession();
  await destroySession();
  if (u) await logActivity({ userId: u.id, action: "LOGOUT", entity: "auth", summary: "Logout" });
  redirect("/dashboard-admin/login?reason=logout");
}

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
    email: z.string().trim().toLowerCase().email("Email tidak valid").max(190),
    password: passwordSchema,
    confirm: z.string(),
    token: z.string().min(1, "Token bootstrap wajib diisi"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Konfirmasi kata sandi tidak sama" });

/** Bootstrap Super Admin pertama. Hanya berfungsi saat tabel users kosong dan BOOTSTRAP_TOKEN cocok. */
export async function bootstrapSignupAction(_p: FormState, fd: FormData): Promise<FormState> {
  const expected = process.env.BOOTSTRAP_TOKEN;
  if (!expected) return { ok: false, message: "Signup dinonaktifkan: BOOTSTRAP_TOKEN belum diatur di server." };
  const ip = await getClientIp();
  const rl = rateLimit(`bootstrap:${ip}`, 5, 15 * 60_000);
  if (!rl.ok) return { ok: false, message: "Terlalu banyak percobaan. Coba lagi nanti." };

  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return { ok: false, message: "Periksa kembali isian formulir.", errors };
  }
  const d = parsed.data;
  if (!safeEqual(d.token, expected)) return { ok: false, errors: { token: "Token bootstrap salah" }, message: "Token bootstrap salah." };

  const passwordHash = await hashPassword(d.password);
  const created = await prisma.$transaction(async (tx) => {
    if ((await tx.user.count()) > 0) return null;
    return tx.user.create({ data: { name: d.name, email: d.email, passwordHash, role: "SUPER_ADMIN" } });
  });
  if (!created) return { ok: false, message: "Super Admin sudah ada. Pendaftaran publik ditutup." };
  await logActivity({ userId: created.id, action: "CREATE", entity: "users", entityId: created.id, summary: "Super Admin pertama dibuat lewat bootstrap" });
  redirect("/dashboard-admin/login?reason=created");
}

/** Dipanggil klien hanya setelah ada interaksi pengguna nyata; server tetap memvalidasi sesi. */
export async function pingSession(): Promise<{ valid: boolean }> {
  return { valid: (await getSession()) !== null };
}

const changePwSchema = z
  .object({ current: z.string().min(1, "Wajib diisi"), password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Konfirmasi kata sandi tidak sama" });

export async function changeOwnPassword(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = changePwSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return { ok: false, message: "Periksa kembali isian.", errors };
  }
  const row = await prisma.user.findUnique({ where: { id: me.id } });
  if (!row || !(await verifyPassword(parsed.data.current, row.passwordHash))) return { ok: false, errors: { current: "Kata sandi saat ini salah" }, message: "Kata sandi saat ini salah." };
  await prisma.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await logActivity({ userId: me.id, action: "PASSWORD", entity: "users", entityId: me.id, summary: "Mengganti kata sandi sendiri" });
  return { ok: true, message: "Kata sandi berhasil diganti." };
}
