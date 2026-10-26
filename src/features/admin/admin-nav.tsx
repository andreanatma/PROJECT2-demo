"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

const MAIN = [
  ["/dashboard-admin", "Overview", "dashboard"],
  ["/dashboard-admin/services", "Services", "design_services"],
  ["/dashboard-admin/products", "Products", "inventory_2"],
  ["/dashboard-admin/portfolio", "Portfolio", "folder_special"],
  ["/dashboard-admin/gallery", "Gallery", "photo_library"],
  ["/dashboard-admin/our-team", "Our Team", "groups"],
  ["/dashboard-admin/blogs", "Blogs", "article"],
  ["/dashboard-admin/contact", "Contact Messages", "mail"],
] as const;
const SYSTEM = [
  ["/dashboard-admin/users", "Users", "manage_accounts", true],
  ["/dashboard-admin/activity-logs", "Activity Logs", "history", false],
  ["/dashboard-admin/media", "Media", "perm_media", false],
  ["/dashboard-admin/seo", "SEO", "troubleshoot", false],
  ["/dashboard-admin/settings", "Settings", "settings", true],
] as const;

export function AdminNav({ role }: { role: "SUPER_ADMIN" | "ADMIN" }) {
  const path = usePathname();
  const item = (href: string, label: string, icon: string) => {
    const active = href === "/dashboard-admin" ? path === href : path.startsWith(href);
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded px-3 py-2 text-body-sm transition-colors", active ? "bg-primary-container text-white" : "text-inverse-on-surface hover:bg-white/10")}>
        <Icon name={icon} className="text-[20px]" />{label}
      </Link>
    );
  };
  return (
    <nav aria-label="Navigasi admin" className="flex flex-col gap-1 px-3">
      <p className="px-3 pb-1 pt-3 text-label-sm uppercase tracking-wider text-outline-variant">Main Management</p>
      {MAIN.map(([h, l, i]) => item(h, l, i))}
      <p className="px-3 pb-1 pt-4 text-label-sm uppercase tracking-wider text-outline-variant">System</p>
      {SYSTEM.filter(([, , , so]) => !so || role === "SUPER_ADMIN").map(([h, l, i]) => item(h, l, i))}
    </nav>
  );
}
