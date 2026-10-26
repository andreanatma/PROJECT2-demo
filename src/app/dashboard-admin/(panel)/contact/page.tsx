import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, pageParam, str, truncate } from "@/lib/utils";
import { EmptyState, Icon, Pagination, StatusBadge } from "@/components/ui";
import { PageHeader } from "@/features/admin/module-pages";

export const metadata = { title: "Contact Messages" };
const PER = 15;

export default async function ContactList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const q = str(sp.q).trim().slice(0, 100);
  const status = ["UNREAD", "READ", "REPLIED"].includes(str(sp.status)) ? str(sp.status) : "";
  const from = str(sp.from), to = str(sp.to);
  const page = pageParam(sp.page);
  const dFrom = from && !isNaN(+new Date(from)) ? new Date(from) : null;
  const dTo = to && !isNaN(+new Date(to)) ? new Date(new Date(to).getTime() + 86_399_000) : null;
  const where = {
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(status ? { status: status as "UNREAD" | "READ" | "REPLIED" } : {}),
    ...(dFrom || dTo ? { createdAt: { ...(dFrom ? { gte: dFrom } : {}), ...(dTo ? { lte: dTo } : {}) } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }),
  ]);
  const params: Record<string, string> = {};
  if (q) params.q = q; if (status) params.status = status; if (from) params.from = from; if (to) params.to = to;
  return (
    <>
      <PageHeader title="Contact Messages" desc={`${total} pesan sesuai filter.`} />
      <form className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_160px_150px_150px_auto]" role="search">
        <input name="q" defaultValue={q} className="input" placeholder="Cari nama atau email…" aria-label="Cari" />
        <select name="status" defaultValue={status} className="input" aria-label="Status"><option value="">Semua status</option><option value="UNREAD">Belum dibaca</option><option value="READ">Dibaca</option><option value="REPLIED">Dibalas</option></select>
        <input type="date" name="from" defaultValue={from} className="input" aria-label="Dari tanggal" />
        <input type="date" name="to" defaultValue={to} className="input" aria-label="Sampai tanggal" />
        <div className="flex gap-2"><button className="btn-primary">Terapkan</button>{Object.keys(params).length > 0 && <Link href="/dashboard-admin/contact" className="btn-ghost">Reset</Link>}</div>
      </form>
      <div className="card overflow-hidden">
        {rows.length === 0 ? <EmptyState icon="mail" title="Tidak ada pesan" text="Pesan dari formulir kontak akan muncul di sini." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-label-md text-[#64748B]"><tr><th className="px-4 py-3">Pengirim</th><th className="px-4 py-3">Pesan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Diterima</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3"><p className={m.status === "UNREAD" ? "text-title-md" : ""}>{m.name}</p><p className="text-on-surface-variant">{m.email}</p></td>
                    <td className="max-w-xs px-4 py-3 text-on-surface-variant">{truncate(m.message, 80)}</td>
                    <td className="px-4 py-3"><StatusBadge value={m.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(m.createdAt, true)}</td>
                    <td className="px-4 py-3 text-right"><Link href={`/dashboard-admin/contact/${m.id}`} className="btn-secondary !px-3 !py-1.5"><Icon name="visibility" className="text-[18px]" />Buka</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} basePath="/dashboard-admin/contact" params={params} />
    </>
  );
}
