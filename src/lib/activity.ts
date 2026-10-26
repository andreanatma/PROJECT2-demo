import "server-only";
import { prisma } from "./db";
import { getClientIp } from "./auth";

export type LogInput = {
  userId: number | null;
  action: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "UPLOAD" | "ROLE_CHANGE" | "SETTINGS" | "PASSWORD" | "LOGIN_FAILED";
  entity: string;
  entityId?: string | number | null;
  summary: string;
};

/** Mencatat aktivitas dari server saja. Jangan pernah menyertakan password/token pada summary. */
export async function logActivity(i: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: i.userId,
        action: i.action,
        entity: i.entity,
        entityId: i.entityId != null ? String(i.entityId) : null,
        summary: i.summary.slice(0, 500),
        ipAddress: await getClientIp(),
      },
    });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
