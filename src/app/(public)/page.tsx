import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { buildMetadata, jsonLd, SITE_URL } from "@/lib/seo";
import { formatDate, truncate } from "@/lib/utils";
import { Icon, MediaImg } from "@/components/ui";
import { CtaBand, SectionHead } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "home", path: "/" });

export default async function Home() {
  const [s, services, products, portfolio, gallery, team, blogs, counts] = await Promise.all([
    getSettings(),
    prisma.service.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.portfolio.findMany({ orderBy: [{ projectDate: "desc" }, { createdAt: "desc" }], take: 3 }),
    prisma.gallery.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.teamMember.findMany({ orderBy: { displayOrder: "asc" }, take: 4 }),
    prisma.blog.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, take: 3 }),
    Promise.all([prisma.service.count(), prisma.product.count(), prisma.portfolio.count(), prisma.blog.count({ where: { status: "PUBLISHED" } })]),
  ]);
  const stats = [["Layanan", counts[0], "design_services"], ["Produk", counts[1], "inventory_2"], ["Proyek", counts[2], "folder_special"], ["Artikel", counts[3], "article"]] as const;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Organization", name: s.company_name, url: SITE_URL, email: s.email, telephone: s.phone, address: s.address }) }} />
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="container-x relative grid items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-label-sm uppercase tracking-wider text-primary"><span className="h-2 w-2 rounded-full bg-primary-container" />{s.company_name}</span>
            <h1 className="text-display-lg-mobile leading-tight tracking-tight md:text-display-lg">{s.hero_title}</h1>
            <p className="max-w-2xl text-body-lg text-on-surface-variant">{s.hero_subtitle}</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/contact" className="btn-accent !px-7 !py-3.5">Konsultasi gratis<Icon name="arrow_forward" className="text-[18px]" /></Link>
              <Link href="/service" className="btn-secondary !px-7 !py-3.5"><Icon name="explore" className="text-[18px]" />Lihat layanan</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-5">
            {stats.map(([l, n, i]) => (
              <div key={l} className="card p-6"><Icon name={i} className="text-primary" /><p className="mt-3 text-headline-xl tabular-nums">{n}</p><p className="text-body-sm text-on-surface-variant">{l} aktif</p></div>
            ))}
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="bg-white py-20"><div className="container-x">
          <SectionHead eyebrow="Layanan kami" title="Solusi sesuai kebutuhan industri Anda" href="/service" linkText="Semua layanan" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((x) => (
              <Link key={x.id} href="/service" className="card flex flex-col gap-4 p-6 transition-shadow hover:shadow-md">
                <MediaImg id={x.imageId} alt={x.name} className="h-36 w-full rounded" icon="design_services" />
                <h3 className="text-headline-md">{x.name}</h3>
                <p className="text-body-sm text-on-surface-variant">{truncate(x.description, 130)}</p>
              </Link>
            ))}
          </div>
        </div></section>
      )}

      {products.length > 0 && (
        <section className="py-20"><div className="container-x">
          <SectionHead eyebrow="Produk unggulan" title="Platform siap pakai berkekuatan industri" href="/products" linkText="Seluruh katalog" />
          <div className="grid gap-8 lg:grid-cols-2">
            {products.map((p) => (
              <article key={p.id} className="card flex flex-col gap-5 p-8">
                <MediaImg id={p.imageId} alt={p.name} className="h-48 w-full rounded" icon="inventory_2" />
                <h3 className="text-headline-lg">{p.name}</h3>
                <p className="text-body-md text-on-surface-variant">{truncate(p.description, 200)}</p>
                <div className="mt-auto flex gap-3"><Link href={`/products/${p.slug}`} className="btn-primary">Lihat detail</Link>{p.pdfId && <a href={`/media/${p.pdfId}`} target="_blank" rel="noreferrer" className="btn-secondary"><Icon name="download" className="text-[18px]" />Brosur PDF</a>}</div>
              </article>
            ))}
          </div>
        </div></section>
      )}

      {portfolio.length > 0 && (
        <section className="bg-white py-20"><div className="container-x">
          <SectionHead eyebrow="Portofolio" title="Dampak nyata yang terukur" href="/portfolio" linkText="Semua studi kasus" />
          <div className="grid gap-8 md:grid-cols-3">
            {portfolio.map((p) => (
              <Link key={p.id} href="/portfolio" className="card group overflow-hidden transition-shadow hover:shadow-lg">
                <MediaImg id={p.imageId} alt={p.name} className="h-52 w-full transition-transform duration-500 group-hover:scale-105" icon="folder_special" />
                <div className="p-6"><h3 className="text-title-lg group-hover:text-primary">{p.name}</h3><p className="mt-2 text-body-sm text-on-surface-variant">{truncate(p.description, 120)}</p></div>
              </Link>
            ))}
          </div>
        </div></section>
      )}

      {gallery.length > 0 && (
        <section className="py-20"><div className="container-x">
          <SectionHead eyebrow="Galeri" title="Di balik layar pusat rekayasa kami" href="/gallery" linkText="Buka galeri" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {gallery.map((g) => <Link key={g.id} href="/gallery" className="group relative block h-56 overflow-hidden rounded-lg"><MediaImg id={g.imageId} alt={g.title} className="h-full w-full transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 to-transparent" /><span className="absolute bottom-3 left-3 right-3 text-title-md text-white">{g.title}</span></Link>)}
          </div>
        </div></section>
      )}

      {team.length > 0 && (
        <section className="bg-white py-20"><div className="container-x">
          <SectionHead eyebrow="Tim ahli" title="Kepemimpinan rekayasa berstandar dunia" href="/our-team" linkText="Seluruh tim" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((t) => <div key={t.id} className="card p-5"><MediaImg id={t.photoId} alt={t.name} className="mb-4 aspect-square w-full rounded" icon="person" /><h3 className="text-title-lg">{t.name}</h3><p className="text-label-md text-primary">{t.position}</p></div>)}
          </div>
        </div></section>
      )}

      {blogs.length > 0 && (
        <section className="py-20"><div className="container-x">
          <SectionHead eyebrow="Wawasan & riset" title="Artikel rekayasa dan tren teknologi" href="/blogs" linkText="Semua artikel" />
          <div className="grid gap-8 md:grid-cols-3">
            {blogs.map((b) => (
              <article key={b.id} className="card overflow-hidden transition-shadow hover:shadow-md">
                <MediaImg id={b.featuredImageId} alt={b.title} className="h-44 w-full" icon="article" />
                <div className="p-6"><p className="text-label-sm text-on-surface-variant">{formatDate(b.publishedAt)}</p><h3 className="mt-2 text-title-lg"><Link href={`/blogs/${b.slug}`} className="hover:text-primary">{b.title}</Link></h3><p className="mt-2 text-body-sm text-on-surface-variant">{truncate(b.excerpt ?? "", 120)}</p></div>
              </article>
            ))}
          </div>
        </div></section>
      )}
      <CtaBand title="Siap mentransformasi infrastruktur digital Anda?" text="Jadwalkan sesi konsultasi bersama tim solusi kami untuk membahas kebutuhan sistem Anda." />
    </>
  );
}
