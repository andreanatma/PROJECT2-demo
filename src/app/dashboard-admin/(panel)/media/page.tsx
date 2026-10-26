import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mediaUsage } from "@/lib/media";
import { formatBytes, formatDate, pageParam } from "@/lib/utils";
import { EmptyState, Icon, MediaImg, Pagination } from "@/components/ui";
import { ConfirmButton } from "@/components/client";
import { PageHeader } from "@/features/admin/module-pages";
import { MediaUploadForm } from "@/features/admin/forms";
import { deleteMediaItem, toggleMediaVisibility } from "@/features/admin-actions";

export const metadata = { title: "Media" };
const PER = 12;

export default async function MediaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const page = pageParam((await searchParams).page);
  const [total, files] = await Promise.all([prisma.mediaFile.count(), prisma.mediaFile.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER })]);
  const usage = await Promise.all(files.map((f) => mediaUsage(f.id)));
  return (
    <>
      <PageHeader title="Media" desc={`${total} file tersimpan. File yang tidak dipakai dapat dihapus.`} />
      <MediaUploadForm />
      {files.length === 0 ? <div className="card"><EmptyState icon="perm_media" title="Belum ada file" text="Unggah gambar atau PDF pertama Anda." /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((f, i) => (
            <div key={f.id} className="card overflow-hidden">
              {f.mimeType === "application/pdf" ? <div className="flex h-36 items-center justify-center bg-surface-container text-primary"><Icon name="picture_as_pdf" className="text-[44px]" /></div> : <MediaImg id={f.id} alt={f.originalName} className="h-36 w-full" />}
              <div className="space-y-2 p-4">
                <p className="truncate text-title-md" title={f.originalName}>{f.originalName}</p>
                <p className="text-body-sm text-on-surface-variant">{formatBytes(f.sizeBytes)} · {formatDate(f.createdAt)}</p>
                <div className="flex flex-wrap gap-1.5"><span className={f.isPublic ? "badge-info" : "badge-warn"}>{f.isPublic ? "Publik" : "Privat"}</span><span className="badge-neutral">{usage[i] ? `Dipakai ${usage[i]}×` : "Tidak dipakai"}</span></div>
                <div className="flex items-center justify-between pt-1">
                  <a href={`/media/${f.id}`} target="_blank" rel="noreferrer" className="text-title-md text-primary hover:underline">Buka</a>
                  <div className="flex items-center gap-1">
                    <form action={toggleMediaVisibility.bind(null, f.id)}><button className="rounded p-1.5 hover:bg-surface-container" aria-label={f.isPublic ? "Jadikan privat" : "Jadikan publik"}><Icon name={f.isPublic ? "lock_open" : "lock"} className="text-[20px]" /></button></form>
                    {usage[i] === 0 && <ConfirmButton action={deleteMediaItem.bind(null, f.id)} title={f.originalName} text="File akan dihapus permanen dari penyimpanan." />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PER))} basePath="/dashboard-admin/media" />
    </>
  );
}
