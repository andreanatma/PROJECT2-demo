import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "./db";
import { fileStore } from "./mock-db";

// MODE DEMO: file upload disimpan di memori proses (hilang saat restart), bukan di disk.
// Default 4 MB karena batas body request fungsi serverless (mis. Vercel) sekitar 4,5 MB.
export const MAX_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 4) * 1024 * 1024;

type Kind = "image" | "pdf";
const TYPES: Record<string, { ext: string; kind: Kind }> = {
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "application/pdf": { ext: "pdf", kind: "pdf" },
};

function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

export type UploadResult = { ok: true; id: number; url: string; name: string; size: number; mime: string } | { ok: false; error: string };

export async function saveUpload(file: File, opts: { accept: Kind[]; isPublic: boolean; userId: number }): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, error: "File belum dipilih." };
  if (file.size > MAX_BYTES) return { ok: false, error: `Ukuran file maksimal ${MAX_BYTES / 1024 / 1024} MB.` };
  const buf = Buffer.from(await file.arrayBuffer());
  const real = sniff(buf); // validasi berdasarkan isi file, bukan hanya MIME dari klien
  if (!real) return { ok: false, error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF." };
  const t = TYPES[real];
  if (!opts.accept.includes(t.kind)) return { ok: false, error: t.kind === "pdf" ? "Field ini hanya menerima gambar." : "Field ini hanya menerima PDF." };
  const claimedExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const okExt = t.ext === "jpg" ? ["jpg", "jpeg"] : [t.ext];
  if (!okExt.includes(claimedExt)) return { ok: false, error: "Ekstensi file tidak sesuai dengan isi file." };

  const now = new Date();
  const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${t.ext}`;
  fileStore.set(key, buf);
  const originalName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 200);
  const row = await prisma.mediaFile.create({
    data: { storageKey: key, originalName, mimeType: real, sizeBytes: buf.length, isPublic: opts.isPublic, uploadedById: opts.userId },
  });
  return { ok: true, id: row.id, url: `/media/${row.id}`, name: originalName, size: buf.length, mime: real };
}

export async function readMediaFile(storageKey: string): Promise<Buffer | null> {
  return fileStore.get(storageKey) ?? null;
}

/** Jumlah entitas yang masih memakai media ini. */
export async function mediaUsage(id: number): Promise<number> {
  const c = await Promise.all([
    prisma.service.count({ where: { imageId: id } }),
    prisma.product.count({ where: { OR: [{ imageId: id }, { pdfId: id }] } }),
    prisma.portfolio.count({ where: { imageId: id } }),
    prisma.gallery.count({ where: { imageId: id } }),
    prisma.teamMember.count({ where: { photoId: id } }),
    prisma.blog.count({ where: { featuredImageId: id } }),
    prisma.seoSetting.count({ where: { ogImageId: id } }),
  ]);
  return c.reduce((a, b) => a + b, 0);
}

export async function deleteMediaIfUnused(id: number | null | undefined): Promise<boolean> {
  if (!id) return false;
  if ((await mediaUsage(id)) > 0) return false;
  const m = await prisma.mediaFile.findUnique({ where: { id } });
  if (!m) return false;
  await prisma.mediaFile.delete({ where: { id } });
  fileStore.delete(m.storageKey);
  return true;
}
