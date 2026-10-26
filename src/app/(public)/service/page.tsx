import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, MediaImg } from "@/components/ui";
import { CtaBand, PageHero } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "service", title: "Layanan", path: "/service" });

export default async function Services() {
  const items = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageHero eyebrow="Layanan konsultasi dan rekayasa sistem" title="Solusi komprehensif rekayasa perangkat lunak dan transformasi cloud" text="Dari arsitektur multi-cloud hingga kecerdasan buatan, kami menjawab tantangan industri yang kompleks." icon="design_services" />
      <section className="container-x">
        {items.length === 0 ? <EmptyState icon="design_services" title="Layanan belum tersedia" text="Konten sedang disiapkan." /> : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <article key={s.id} id={s.slug} className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                <MediaImg id={s.imageId} alt={s.name} className="h-48 w-full" icon="design_services" />
                <div className="p-8"><h2 className="text-headline-lg">{s.name}</h2><p className="mt-3 whitespace-pre-line text-body-md text-on-surface-variant">{s.description}</p></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <CtaBand title="Butuh layanan yang disesuaikan?" text="Ceritakan tantangan Anda dan kami siapkan rekomendasi arsitektur." />
    </>
  );
}
