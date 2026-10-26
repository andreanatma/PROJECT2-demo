import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildMetadata, jsonLd, SITE_URL } from "@/lib/seo";
import { Icon, MediaImg, SafeText } from "@/components/ui";
import { CtaBand } from "@/components/public";

type P = { params: Promise<{ slug: string }> };
const get = (slug: string) => prisma.product.findUnique({ where: { slug } });

export async function generateMetadata({ params }: P) {
  const p = await get((await params).slug);
  if (!p) return {};
  return buildMetadata({ title: p.metaTitle || p.name, description: p.metaDescription || p.description.slice(0, 155), path: `/products/${p.slug}`, image: p.imageId ? `/media/${p.imageId}` : null });
}

export default async function ProductDetail({ params }: P) {
  const p = await get((await params).slug);
  if (!p) notFound();
  const specs = (p.specifications ?? "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(":"); return i > 0 ? [l.slice(0, i), l.slice(i + 1).trim()] : [l, ""]; });
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description, image: p.imageId ? `${SITE_URL}/media/${p.imageId}` : undefined, url: `${SITE_URL}/products/${p.slug}` }) }} />
      <div className="container-x pt-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-label-md text-on-surface-variant"><Link href="/products" className="hover:text-primary">Products</Link><Icon name="chevron_right" className="text-[14px]" /><span className="text-on-surface">{p.name}</span></nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <MediaImg id={p.imageId} alt={p.name} className="h-80 w-full rounded-lg lg:h-[420px]" icon="inventory_2" />
          <div><h1 className="text-display-md-mobile md:text-display-md">{p.name}</h1><div className="mt-5"><SafeText text={p.description} /></div>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/contact" className="btn-accent">Jadwalkan demo</Link>{p.pdfId && <a href={`/media/${p.pdfId}`} target="_blank" rel="noreferrer" className="btn-secondary"><Icon name="picture_as_pdf" className="text-[18px]" />Unduh PDF</a>}</div>
          </div>
        </div>
        {specs.length > 0 && (
          <section className="card mt-12 overflow-hidden"><h2 className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-6 py-4 text-title-lg">Spesifikasi</h2>
            <dl className="divide-y divide-[#F1F5F9]">{specs.map(([k, v], i) => <div key={i} className="grid gap-1 px-6 py-3 sm:grid-cols-3"><dt className="text-title-md">{k}</dt><dd className="text-on-surface-variant sm:col-span-2">{v}</dd></div>)}</dl>
          </section>
        )}
      </div>
      <CtaBand title="Butuh demo atau spesifikasi khusus?" text="Tim kami siap membantu evaluasi dan proof-of-concept." />
    </>
  );
}
