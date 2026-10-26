import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { formatDate, pageParam, str, truncate } from "@/lib/utils";
import { EmptyState, Icon, MediaImg, Pagination } from "@/components/ui";
import { PageHero } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "blogs", title: "Blog", path: "/blogs" });
const PER = 9;

export default async function Blogs({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = str(sp.q).trim().slice(0, 80);
  const page = pageParam(sp.page);
  const where = { status: "PUBLISHED" as const, ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {}) };
  const [total, items] = await Promise.all([prisma.blog.count({ where }), prisma.blog.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * PER, take: PER })]);
  return (
    <>
      <PageHero eyebrow="Wawasan teknologi dan artikel riset" title="Wawasan terkini seputar arsitektur sistem, AI, dan transformasi digital" text="Analisis mendalam dan studi kasus teknis dari tim kami." icon="terminal" />
      <section className="container-x">
        <form role="search" className="mb-8 flex max-w-xl gap-3"><div className="relative flex-1"><Icon name="search" className="pointer-events-none absolute left-3 top-2.5 text-outline" /><input name="q" defaultValue={q} className="input !pl-10" placeholder="Cari artikel…" aria-label="Cari artikel" /></div><button className="btn-primary">Cari</button></form>
        {items.length === 0 ? <EmptyState icon="article" title={q ? "Artikel tidak ditemukan" : "Belum ada artikel"} /> : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((b) => (
              <article key={b.id} className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                <MediaImg id={b.featuredImageId} alt={b.title} className="h-48 w-full" icon="article" />
                <div className="flex flex-1 flex-col p-6"><p className="text-label-sm text-on-surface-variant">{formatDate(b.publishedAt)}</p><h2 className="mt-2 text-title-lg"><Link href={`/blogs/${b.slug}`} className="hover:text-primary">{b.title}</Link></h2><p className="mt-2 flex-1 text-body-sm text-on-surface-variant">{truncate(b.excerpt ?? "", 140)}</p><Link href={`/blogs/${b.slug}`} className="mt-4 inline-flex items-center gap-1 text-title-md text-primary">Baca<Icon name="chevron_right" className="text-[16px]" /></Link></div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} basePath="/blogs" params={q ? { q } : undefined} />
      </section>
    </>
  );
}
