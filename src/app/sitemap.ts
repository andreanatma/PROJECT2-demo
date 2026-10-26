import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { PAGE_KEYS, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, blogs, noindex] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.blog.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    prisma.seoSetting.findMany({ where: { noindex: true }, select: { pageKey: true } }),
  ]);
  const hidden = new Set(noindex.map((n) => n.pageKey));
  return [
    ...PAGE_KEYS.filter((p) => !hidden.has(p.key)).map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, changeFrequency: "weekly" as const, priority: p.path === "/" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
    ...blogs.map((b) => ({ url: `${SITE_URL}/blogs/${b.slug}`, lastModified: b.updatedAt, priority: 0.6 })),
  ];
}
