import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PAGE_KEYS } from "@/lib/seo";
import { PageHeader } from "@/features/admin/module-pages";
import { SeoForm } from "@/features/admin/forms";

export const metadata = { title: "SEO" };
export default async function SeoPage() {
  await requireUser();
  const rows = await prisma.seoSetting.findMany({ include: { ogImage: true } });
  const map: Record<string, { title: string; description: string; ogImageId: number | null; noindex: boolean }> = {};
  const names: Record<string, string> = {};
  for (const r of rows) { map[r.pageKey] = { title: r.title ?? "", description: r.description ?? "", ogImageId: r.ogImageId, noindex: r.noindex }; if (r.ogImage) names[r.pageKey] = r.ogImage.originalName; }
  return (
    <>
      <PageHeader title="SEO" desc="Metadata default untuk halaman publik. Halaman admin selalu noindex dan tidak masuk sitemap." />
      <SeoForm pages={PAGE_KEYS.map((p) => ({ key: p.key, label: p.label, path: p.path }))} rows={map} names={names} />
    </>
  );
}
