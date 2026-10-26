import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import type { Role } from "./mock-db";

export const SESSION_COOKIE = "apex_admin_session";
const IDLE_MS = (Number(process.env.SESSION_IDLE_MINUTES) || 60) * 60_000;
const MAX_MS = (Number(process.env.SESSION_MAX_HOURS) || 12) * 3_600_000;
const TOUCH_INTERVAL_MS = 60_000;

export const IDLE_MINUTES = IDLE_MS / 60_000;

export type AuthUser = { id: number; name: string; email: string; role: Role };

/**
 * MODE DEMO: sesi bersifat STATELESS (token bertanda tangan HMAC di cookie), bukan baris di database.
 * Alasannya: di hosting serverless (Vercel) setiap request bisa dilayani instance berbeda dengan memori
 * berbeda, sehingga sesi yang disimpan di memori satu instance tidak dikenali instance lain (admin "terlempar" login).
 * Semua instance cukup berbagi SESSION_SECRET (atau turunan dari DEMO_ADMIN_PASSWORD) untuk memvalidasi token.
 */
const SECRET = process.env.SESSION_SECRET || `apex-demo-session:${process.env.DEMO_ADMIN_PASSWORD ?? ""}:${process.env.BOOTSTRAP_TOKEN ?? ""}`;

type Payload = { u: number; c: number; a: number }; // user id, dibuat pada, aktivitas terakhir (epoch ms)

const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("base64url");

function encode(p: Payload): string {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): Payload | null {
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    return Number.isInteger(p.u) && Number.isFinite(p.c) && Number.isFinite(p.a) ? p : null;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: Math.floor(MAX_MS / 1000),
};

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

export async function createSession(userId: number): Promise<void> {
  const now = Date.now();
  (await cookies()).set(SESSION_COOKIE, encode({ u: userId, c: now, a: now }), cookieOpts);
}

/**
 * Validasi sesi di server: tanda tangan, umur maksimum, idle timeout (dari `a`), dan status pengguna.
 * Perpanjangan idle ditulis ke cookie hanya bila konteksnya mengizinkan (server action / route handler);
 * saat render halaman, penulisan cookie ditolak Next.js dan diabaikan. Klien juga memanggil pingSession() berkala.
 */
export async function getSession(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const p = decode(token);
  if (!p) return null;
  const now = Date.now();
  if (now - p.a > IDLE_MS || now - p.c > MAX_MS) return null;
  const user = await prisma.user.findUnique({ where: { id: p.u } });
  if (!user || !user.isActive) return null;
  if (now - p.a > TOUCH_INTERVAL_MS) {
    try { jar.set(SESSION_COOKIE, encode({ ...p, a: now }), { ...cookieOpts, maxAge: Math.max(1, Math.floor((p.c + MAX_MS - now) / 1000)) }); } catch { /* konteks render: abaikan */ }
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Token stateless tidak bisa dicabut satu per satu; akun nonaktif/dihapus otomatis ditolak oleh getSession(). */
export async function destroyUserSessions(userId: number): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function requireUser(): Promise<AuthUser> {
  const u = await getSession();
  if (!u) redirect("/dashboard-admin/login?reason=expired");
  return u;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  const u = await requireUser();
  if (u.role !== "SUPER_ADMIN") redirect("/dashboard-admin?msg=" + encodeURIComponent("Akses ditolak: hanya Super Admin."));
  return u;
}
