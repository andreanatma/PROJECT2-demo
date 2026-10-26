import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, pageParam, str } from "@/lib/utils";
import { EmptyState, Pagination } from "@/components/ui";
import { PageHeader } from "@/features/admin/module-pages";

export const metadata = { title: "Activity Logs" };
const PER = 25;
const ACTIONS = ["LOGIN", "LOGIN_FAILED", "LOGOUT", "CREATE", "UPDATE", "DELETE", "UPLOAD", "ROLE_CHANGE", "PASSWORD", "SETTINGS"];

export default async function Logs({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const action = ACTIONS.includes(str(sp.action)) ? str(sp.action) : "";
  const page = pageParam(sp.page);
  const where = action ? { action } : {};
  const [total, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true, email: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Activity Logs" desc="Catatan hanya-baca yang dibuat server. Tidak dapat diubah atau dihapus dari aplikasi." />
      <form className="mb-4 flex gap-3">
        <select name="action" defaultValue={action} className="input max-w-xs" aria-label="Filter aksi"><option value="">Semua aksi</option>{ACTIONS.map((a) => <option key={a}>{a}</option>)}</select>
        <button className="btn-secondary">Filter</button>{action && <Link href="/dashboard-admin/activity-logs" className="btn-ghost">Reset</Link>}
      </form>
      <div className="card overflow-hidden">
        {rows.length === 0 ? <EmptyState icon="history" title="Belum ada aktivitas" /> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-body-sm">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-label-md text-[#64748B]"><tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Aksi</th><th className="px-4 py-3">Modul</th><th className="px-4 py-3">Ringkasan</th><th className="px-4 py-3">IP</th></tr></thead>
            <tbody className="divide-y divide-[#F1F5F9]">{rows.map((l) => (
              <tr key={l.id} className="hover:bg-[#F8FAFC]"><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(l.createdAt, true)}</td><td className="px-4 py-3">{l.user?.name ?? "-"}</td><td className="px-4 py-3"><span className="badge-neutral">{l.action}</span></td><td className="px-4 py-3">{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</td><td className="px-4 py-3 text-on-surface-variant">{l.summary}</td><td className="px-4 py-3 tabular-nums text-outline">{l.ipAddress}</td></tr>
            ))}</tbody></table></div>
        )}
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} basePath="/dashboard-admin/activity-logs" params={action ? { action } : undefined} />
    </>
  );
}
