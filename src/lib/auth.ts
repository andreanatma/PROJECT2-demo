import "server-only";
import { createHash, randomBytes } from "crypto";
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

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim().slice(0, 64);
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const h = await headers();
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      ipAddress: await getClientIp(),
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
      expiresAt: new Date(Date.now() + MAX_MS),
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(MAX_MS / 1000),
  });
}

/**
 * Validasi sesi di server. Idle timeout dihitung dari lastActivityAt di database,
 * yang hanya diperbarui oleh request terautentikasi yang lolos validasi ini.
 */
export async function getSession(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const s = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
  if (!s) return null;
  const now = Date.now();
  const idle = now - s.lastActivityAt.getTime() > IDLE_MS;
  const expired = s.expiresAt.getTime() < now;
  if (idle || expired || !s.user.isActive) {
    await prisma.session.delete({ where: { id: s.id } }).catch(() => undefined);
    return null;
  }
  if (now - s.lastActivityAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session.update({ where: { id: s.id }, data: { lastActivityAt: new Date(now) } }).catch(() => undefined);
  }
  return { id: s.user.id, name: s.user.name, email: s.user.email, role: s.user.role };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

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
