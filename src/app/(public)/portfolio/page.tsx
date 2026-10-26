import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";
import { EmptyState, MediaImg } from "@/components/ui";
import { CtaBand, PageHero } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "portfolio", title: "Portofolio", path: "/portfolio" });

export default async function Portfolio() {
  const items = await prisma.portfolio.findMany({ orderBy: [{ projectDate: "desc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHero eyebrow="Studi kasus dan rekayasa digital" title="Portofolio transformasi digital skala nasional dan global" text="Rekam jejak implementasi bersama mitra korporasi." icon="folder_special" />
      <section className="container-x">
        {items.length === 0 ? <EmptyState icon="folder_special" title="Portofolio belum tersedia" /> : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <article key={p.id} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                <div className="overflow-hidden"><MediaImg id={p.imageId} alt={p.name} className="h-56 w-full transition-transform duration-500 group-hover:scale-105" icon="folder_special" /></div>
                <div className="p-6 lg:p-8">{p.projectDate && <p className="text-label-md text-primary">{formatDate(p.projectDate)}</p>}<h2 className="mt-1 text-headline-md">{p.name}</h2><p className="mt-3 whitespace-pre-line text-body-md text-on-surface-variant">{p.description}</p></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <CtaBand title="Punya tantangan serupa?" text="Diskusikan studi kelayakan dan strategi mitigasi risiko bersama arsitek kami." />
    </>
  );
}
