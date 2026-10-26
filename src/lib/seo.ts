import "server-only";
import type { Metadata } from "next";
import { prisma } from "./db";
import { getSettings } from "./settings";

export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const PAGE_KEYS = [
  { key: "home", label: "Beranda", path: "/" },
  { key: "service", label: "Services", path: "/service" },
  { key: "products", label: "Products", path: "/products" },
  { key: "portfolio", label: "Portfolio", path: "/portfolio" },
  { key: "gallery", label: "Gallery", path: "/gallery" },
  { key: "our-team", label: "Our Team", path: "/our-team" },
  { key: "blogs", label: "Blogs", path: "/blogs" },
  { key: "contact", label: "Contact", path: "/contact" },
] as const;

type Opts = { pageKey?: string; title?: string; description?: string; path: string; image?: string | null; type?: "website" | "article"; noindex?: boolean };

export async function buildMetadata(o: Opts): Promise<Metadata> {
  const [s, seo] = await Promise.all([getSettings(), o.pageKey ? prisma.seoSetting.findUnique({ where: { pageKey: o.pageKey } }) : null]);
  const title = seo?.title || o.title || s.company_name;
  const description = seo?.description || o.description || s.tagline;
  const image = seo?.ogImageId ? `/media/${seo.ogImageId}` : o.image ?? undefined;
  const noindex = seo?.noindex || o.noindex;
  return {
    title,
    description,
    alternates: { canonical: o.path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url: o.path, siteName: s.company_name, type: o.type ?? "website", locale: "id_ID", images: image ? [{ url: image }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
