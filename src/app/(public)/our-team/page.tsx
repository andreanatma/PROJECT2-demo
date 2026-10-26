import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, MediaImg } from "@/components/ui";
import { PageHero } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "our-team", title: "Tim Kami", path: "/our-team" });

export default async function Team() {
  const items = await prisma.teamMember.findMany({ orderBy: [{ displayOrder: "asc" }, { id: "asc" }] });
  return (
    <>
      <PageHero eyebrow="Tim rekayasa dan kepemimpinan" title="Para arsitek, peneliti, dan pemimpin inovasi" text="Mengenal orang-orang yang membangun fondasi digital tangguh untuk klien kami." icon="groups" />
      <section className="container-x">
        {items.length === 0 ? <EmptyState icon="groups" title="Data tim belum tersedia" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((t) => <div key={t.id} className="card p-5 transition-shadow hover:shadow-md"><MediaImg id={t.photoId} alt={`Foto ${t.name}`} className="mb-4 aspect-square w-full rounded" icon="person" /><h2 className="text-title-lg">{t.name}</h2><p className="text-body-sm text-primary">{t.position}</p></div>)}
          </div>
        )}
      </section>
    </>
  );
}
