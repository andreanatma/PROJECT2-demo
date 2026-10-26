import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { str, truncate } from "@/lib/utils";
import { EmptyState, Icon, MediaImg } from "@/components/ui";
import { PageHero } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "products", title: "Produk", path: "/products" });

export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = str((await searchParams).q).trim().slice(0, 80);
  const items = await prisma.product.findMany({ where: q ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] } : {}, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHero eyebrow="Katalog produk enterprise" title="Platform piranti lunak dan perangkat cerdas skala industri" text="Produk siap pakai dengan keandalan tinggi dan integrasi API terbuka." icon="inventory_2" />
      <section className="container-x">
        <form role="search" className="mb-8 flex max-w-xl gap-3"><div className="relative flex-1"><Icon name="search" className="pointer-events-none absolute left-3 top-2.5 text-outline" /><input name="q" defaultValue={q} className="input !pl-10" placeholder="Cari produk…" aria-label="Cari produk" /></div><button className="btn-primary">Cari</button></form>
        {items.length === 0 ? <EmptyState icon="inventory_2" title={q ? "Produk tidak ditemukan" : "Produk belum tersedia"} text={q ? "Coba kata kunci lain." : undefined} action={q ? <Link href="/products" className="btn-secondary mt-3">Reset pencarian</Link> : undefined} /> : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <article key={p.id} className="card flex flex-col p-6 transition-shadow hover:shadow-md">
                <MediaImg id={p.imageId} alt={p.name} className="mb-5 h-48 w-full rounded" icon="inventory_2" />
                <h2 className="text-headline-lg"><Link href={`/products/${p.slug}`} className="hover:text-primary">{p.name}</Link></h2>
                <p className="mt-2 flex-1 text-body-md text-on-surface-variant">{truncate(p.description, 170)}</p>
                <div className="mt-5 flex gap-2"><Link href={`/products/${p.slug}`} className="btn-accent flex-1">Pelajari detail</Link>{p.pdfId && <a href={`/media/${p.pdfId}`} target="_blank" rel="noreferrer" className="btn-secondary !px-3" aria-label={`Unduh PDF ${p.name}`}><Icon name="picture_as_pdf" /></a>}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
