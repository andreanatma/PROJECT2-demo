"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./ui";
import { cn } from "@/lib/utils";

const LINKS = [["/", "Home"], ["/service", "Services"], ["/products", "Products"], ["/portfolio", "Portfolio"], ["/gallery", "Gallery"], ["/our-team", "Our Team"], ["/blogs", "Blogs"], ["/contact", "Contact"]] as const;

export function SiteNav({ name }: { name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <header className="fixed top-0 z-50 w-full bg-white/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="container-x flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-title-lg font-bold tracking-tight"><span className="flex h-8 w-8 items-center justify-center rounded bg-primary-container text-white"><Icon name="deployed_code" className="text-[20px]" /></span>{name}</Link>
        <nav aria-label="Utama" className="hidden items-center gap-6 xl:flex">
          {LINKS.map(([h, l]) => <Link key={h} href={h} aria-current={active(h) ? "page" : undefined} className={cn("text-body-md transition-colors", active(h) ? "font-semibold text-primary" : "text-on-surface-variant hover:text-on-surface")}>{l}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/contact" className="btn-accent hidden sm:inline-flex">Hubungi Kami</Link>
          <button className="rounded p-2 hover:bg-[#F1F5F9] xl:hidden" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
        </div>
      </div>
      {open && (
        <nav aria-label="Seluler" className="container-x flex flex-col gap-1 border-t border-[#E2E8F0] pb-4 pt-2 xl:hidden">
          {LINKS.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)} className={cn("rounded px-3 py-2.5", active(h) ? "bg-surface-container text-primary" : "hover:bg-[#F8FAFC]")}>{l}</Link>)}
          <Link href="/contact" onClick={() => setOpen(false)} className="btn-accent mt-2">Hubungi Kami</Link>
        </nav>
      )}
    </header>
  );
}
