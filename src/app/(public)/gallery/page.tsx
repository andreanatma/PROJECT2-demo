import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Lightbox } from "@/components/client";
import { EmptyState } from "@/components/ui";
import { PageHero } from "@/components/public";

export const generateMetadata = () => buildMetadata({ pageKey: "gallery", title: "Galeri", path: "/gallery" });

export default async function Gallery() {
  const items = await prisma.gallery.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, description: true, imageId: true } });
  return (
    <>
      <PageHero eyebrow="Galeri dan budaya inovasi" title="Melihat lebih dekat ruang kerja, riset, dan ekosistem kami" text="Dokumentasi di balik layar pusat rekayasa teknologi." icon="photo_camera" />
      <section className="container-x">{items.length === 0 ? <EmptyState icon="photo_library" title="Galeri belum tersedia" /> : <Lightbox items={items} />}</section>
    </>
  );
}
