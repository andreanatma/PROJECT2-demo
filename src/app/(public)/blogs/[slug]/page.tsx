import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildMetadata, jsonLd, SITE_URL } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { Icon, MediaImg, SafeText } from "@/components/ui";

type P = { params: Promise<{ slug: string }> };
// Artikel Draft hanya dapat dipratinjau oleh admin yang login (dicek di server).
async function get(slug: string) {
  const b = await prisma.blog.findUnique({ where: { slug } });
  if (!b) return null;
  if (b.status === "PUBLISHED") return b;
  return (await getSession()) ? b : null;
}

export async function generateMetadata({ params }: P) {
  const b = await get((await params).slug);
  if (!b) return {};
  if (b.status !== "PUBLISHED") return { title: `Pratinjau: ${b.title}`, robots: { index: false, follow: false } };
  return buildMetadata({ title: b.metaTitle || b.title, description: b.metaDescription || b.excerpt || undefined, path: `/blogs/${b.slug}`, image: b.featuredImageId ? `/media/${b.featuredImageId}` : null, type: "article" });
}

export default async function BlogDetail({ params }: P) {
  const b = await get((await params).slug);
  if (!b) notFound();
  return (
    <article className="container-x max-w-3xl pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "BlogPosting", headline: b.title, datePublished: b.publishedAt?.toISOString(), dateModified: b.updatedAt.toISOString(), image: b.featuredImageId ? `${SITE_URL}/media/${b.featuredImageId}` : undefined, mainEntityOfPage: `${SITE_URL}/blogs/${b.slug}`, description: b.excerpt ?? undefined }) }} />
      {b.status !== "PUBLISHED" && <div role="status" className="mb-6 rounded border border-accent bg-[#FEF3C7] px-4 py-3 text-body-sm text-[#92400E]">Pratinjau draft: artikel ini belum dipublikasikan dan hanya terlihat oleh admin.</div>}
      <Link href="/blogs" className="mb-6 inline-flex items-center gap-1 text-label-md text-on-surface-variant hover:text-primary"><Icon name="arrow_back" className="text-[16px]" />Semua artikel</Link>
      <h1 className="text-display-md-mobile md:text-display-md">{b.title}</h1>
      <p className="mt-3 text-body-sm text-on-surface-variant">{formatDate(b.publishedAt)}</p>
      {b.featuredImageId && <MediaImg id={b.featuredImageId} alt={b.title} className="my-8 h-72 w-full rounded-lg md:h-96" />}
      <div className="mt-8"><SafeText text={b.content} /></div>
    </article>
  );
}
