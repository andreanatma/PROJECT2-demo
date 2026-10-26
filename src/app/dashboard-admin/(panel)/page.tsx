import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/utils";
import { Icon, StatusBadge } from "@/components/ui";
import { PageHeader } from "@/features/admin/module-pages";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const user = await requireUser();
  const since = new Date(Date.now() - 13 * 86_400_000);
  since.setHours(0, 0, 0, 0);
  const [services, products, portfolio, gallery, team, blogs, messages, admins, unread, recentMsgs, recentLogs, msgDates] = await Promise.all([
    prisma.service.count(), prisma.product.count(), prisma.portfolio.count(), prisma.gallery.count(),
    prisma.teamMember.count(), prisma.blog.count(), prisma.contactMessage.count(), prisma.user.count(),
    prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true } } } }),
    prisma.contactMessage.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(since); d.setDate(d.getDate() + i); return d; });
  const key = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const counts = days.map((d) => msgDates.filter((m) => key(m.createdAt) === key(d)).length);
  const max = Math.max(1, ...counts);

  const stats = [
    ["Total layanan", services, "design_services", "/dashboard-admin/services"],
    ["Total produk", products, "inventory_2", "/dashboard-admin/products"],
    ["Total portfolio", portfolio, "folder_special", "/dashboard-admin/portfolio"],
    ["Total galeri", gallery, "photo_library", "/dashboard-admin/gallery"],
    ["Anggota tim", team, "groups", "/dashboard-admin/our-team"],
    ["Artikel blog", blogs, "article", "/dashboard-admin/blogs"],
    ["Pesan kontak", messages, "mail", "/dashboard-admin/contact"],
    ["Administrator", admins, "shield_person", "/dashboard-admin/users"],
  ] as const;

  return (
    <>
      <PageHeader title={`Selamat datang, ${user.name}`} desc="Ringkasan data langsung dari database." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v, i, h]) => (
          <Link key={l} href={h} className="card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="text-label-md uppercase text-[#64748B]">{l}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded bg-surface-container text-primary"><Icon name={i} className="text-[20px]" /></span>
            </div>
            <p className="mt-3 text-headline-xl tabular-nums">{v}</p>
            {l === "Pesan kontak" && unread > 0 && <p className="text-body-sm text-error">{unread} belum dibaca</p>}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2" aria-labelledby="chart-t">
          <h2 id="chart-t" className="text-title-lg">Pesan masuk 14 hari terakhir</h2>
          <div className="mt-6 flex h-44 items-end gap-2" role="img" aria-label={`Grafik batang pesan masuk per hari, total ${counts.reduce((a, b) => a + b, 0)}`}>
            {counts.map((c, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-label-sm tabular-nums text-on-surface-variant">{c || ""}</span>
                <div className="w-full rounded-t bg-primary-container" style={{ height: `${Math.max(c ? 6 : 2, (c / max) * 100)}%`, opacity: c ? 1 : 0.2 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-label-sm text-on-surface-variant"><span>{formatDate(days[0])}</span><span>Hari ini</span></div>
        </section>
        <section className="card p-6" aria-labelledby="sc-t">
          <h2 id="sc-t" className="text-title-lg">Buat konten baru</h2>
          <div className="mt-4 flex flex-col gap-2">
            {[["services", "Layanan", "design_services"], ["products", "Produk", "inventory_2"], ["portfolio", "Proyek portfolio", "folder_special"], ["blogs", "Artikel blog", "article"], ["gallery", "Foto galeri", "photo_library"]].map(([k, l, i]) => (
              <Link key={k} href={`/dashboard-admin/${k}/new`} className="flex items-center gap-3 rounded border border-[#E2E8F0] px-3 py-2.5 text-body-sm hover:bg-[#F8FAFC]"><Icon name={i} className="text-primary" />{l}<Icon name="add" className="ml-auto text-outline" /></Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="rm-t">
          <div className="mb-3 flex items-center justify-between"><h2 id="rm-t" className="text-title-lg">Pesan terbaru</h2><Link href="/dashboard-admin/contact" className="text-title-md text-primary hover:underline">Lihat semua</Link></div>
          {recentMsgs.length === 0 ? <p className="py-6 text-center text-body-sm text-on-surface-variant">Belum ada pesan masuk.</p> : (
            <ul className="divide-y divide-[#F1F5F9]">
              {recentMsgs.map((m) => (
                <li key={m.id}><Link href={`/dashboard-admin/contact/${m.id}`} className="flex items-start justify-between gap-3 py-3 hover:bg-[#F8FAFC]">
                  <div className="min-w-0"><p className="text-title-md">{m.name} <span className="text-body-sm font-normal text-on-surface-variant">· {m.email}</span></p><p className="truncate text-body-sm text-on-surface-variant">{truncate(m.message, 90)}</p></div>
                  <div className="shrink-0 text-right"><StatusBadge value={m.status} /><p className="mt-1 text-label-sm text-outline">{formatDate(m.createdAt, true)}</p></div>
                </Link></li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-6" aria-labelledby="al-t">
          <div className="mb-3 flex items-center justify-between"><h2 id="al-t" className="text-title-lg">Aktivitas administrator</h2><Link href="/dashboard-admin/activity-logs" className="text-title-md text-primary hover:underline">Semua log</Link></div>
          {recentLogs.length === 0 ? <p className="py-6 text-center text-body-sm text-on-surface-variant">Belum ada aktivitas.</p> : (
            <ul className="space-y-4">
              {recentLogs.map((l) => (
                <li key={l.id} className="border-l-2 border-primary-container pl-4">
                  <p className="text-body-sm"><span className="text-title-md">{l.user?.name ?? "Sistem"}</span> · {l.summary}</p>
                  <p className="text-label-sm text-outline">{formatDate(l.createdAt, true)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
