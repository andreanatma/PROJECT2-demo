"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui";

const SECTIONS: [string, string, string][] = [
  ["/service", "/dashboard-admin/services", "Services"],
  ["/products", "/dashboard-admin/products", "Products"],
  ["/portfolio", "/dashboard-admin/portfolio", "Portfolio"],
  ["/gallery", "/dashboard-admin/gallery", "Gallery"],
  ["/our-team", "/dashboard-admin/our-team", "Our Team"],
  ["/blogs", "/dashboard-admin/blogs", "Blogs"],
  ["/contact", "/dashboard-admin/contact", "Contact"],
];

/** Bar mengambang untuk admin yang sedang login: kembali ke dashboard / kelola halaman yang sedang dilihat. */
export function AdminBar({ name }: { name: string }) {
  const path = usePathname();
  const [hidden, setHidden] = useState(false);
  const section = SECTIONS.find(([p]) => path === p || path.startsWith(p + "/"));
  if (hidden) {
    return (
      <Link href="/dashboard-admin" aria-label="Kembali ke Dashboard" className="fixed bottom-4 right-4 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-accent text-navy shadow-lg hover:bg-accent-hover"><Icon name="dashboard" /></Link>
    );
  }
  return (
    <div role="region" aria-label="Bar admin" className="fixed bottom-4 left-1/2 z-[80] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2 rounded-full bg-navy py-2 pl-4 pr-2 text-white shadow-[0_10px_25px_-5px_rgba(15,23,42,0.4)]">
      <span className="hidden items-center gap-1.5 text-label-md text-slate-300 md:flex"><Icon name="shield_person" className="text-[18px]" />Mode admin · {name}</span>
      {section && <Link href={section[1]} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-label-md hover:bg-white/20"><Icon name="edit" className="text-[16px]" />Kelola {section[2]}</Link>}
      <Link href="/dashboard-admin" className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-label-md font-semibold text-navy hover:bg-accent-hover"><Icon name="arrow_back" className="text-[16px]" />Kembali ke Dashboard</Link>
      <button onClick={() => setHidden(true)} aria-label="Sembunyikan bar admin" className="rounded-full p-1.5 text-slate-300 hover:bg-white/10"><Icon name="close" className="text-[18px]" /></button>
    </div>
  );
}
