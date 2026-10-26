"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import type { FormState } from "./crud-actions";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(120, "Nama terlalu panjang"),
  email: z.string().trim().toLowerCase().email("Email tidak valid").max(190),
  message: z.string().trim().min(10, "Pesan minimal 10 karakter").max(2000, "Pesan maksimal 2.000 karakter"),
});

export async function submitContact(_p: FormState, fd: FormData): Promise<FormState> {
  // Honeypot: bot mengisi field tersembunyi. Pura-pura sukses agar tidak memberi sinyal.
  if (String(fd.get("website") ?? "") !== "") return { ok: true, message: "Pesan Anda telah kami terima." };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const ipHash = createHash("sha256").update(ip + (process.env.BOOTSTRAP_TOKEN ?? "salt")).digest("hex");

  const rl = rateLimit(`contact:${ipHash}`, 5, 10 * 60_000);
  if (!rl.ok) return { ok: false, message: "Terlalu banyak pengiriman. Coba lagi beberapa menit lagi." };
  // Batas persisten di database (bertahan antar restart / multi-instance)
  const recent = await prisma.contactMessage.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } } });
  if (recent >= 10) return { ok: false, message: "Batas pengiriman per jam tercapai. Silakan coba lagi nanti." };

  const parsed = schema.safeParse({ name: fd.get("name"), email: fd.get("email"), message: fd.get("message") });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] = i.message;
    return { ok: false, message: "Periksa kembali isian formulir.", errors };
  }
  try {
    await prisma.contactMessage.create({ data: { ...parsed.data, ipHash } });
  } catch (e) {
    console.error("contact", e);
    return { ok: false, message: "Pesan gagal disimpan. Silakan coba lagi." };
  }
  return { ok: true, message: "Pesan Anda telah tersimpan. Tim kami akan menghubungi Anda melalui email." };
}
