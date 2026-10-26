import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readMediaFile } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse("Not found", { status: 404 });
  const m = await prisma.mediaFile.findUnique({ where: { id } });
  if (!m) return new NextResponse("Not found", { status: 404 });
  if (!m.isPublic && !(await getSession())) return new NextResponse("Forbidden", { status: 403 });
  const buf = await readMediaFile(m.storageKey);
  if (!buf) return new NextResponse("Not found", { status: 404 });
  const safeName = m.originalName.replace(/[^\w.\- ]+/g, "_");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": m.mimeType,
      "Content-Length": String(buf.length),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Cache-Control": m.isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
    },
  });
}
