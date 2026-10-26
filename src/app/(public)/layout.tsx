import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { Icon } from "@/components/ui";
import { SiteNav } from "@/components/site-nav";
import { AdminBar } from "@/components/admin-bar";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [s, admin] = await Promise.all([getSettings(), getSession()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2">Lewati ke konten</a>
      <SiteNav name={s.company_name} />
      {admin && <AdminBar name={admin.name} />}
      <main id="main" className="min-h-[60vh] pt-20">{children}</main>
      <footer className="mt-20 bg-surface-container-low pb-12 pt-16">
        <div className="container-x">
          <div className="mb-12 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <span className="flex items-center gap-3 text-title-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded bg-primary-container text-white"><Icon name="deployed_code" className="text-[20px]" /></span>{s.company_name}</span>
              <p className="max-w-sm text-body-md text-on-surface-variant">{s.footer_description}</p>
              <p className="text-body-sm text-on-surface-variant">{s.address}<br />{s.email} · {s.phone}</p>
            </div>
            {[["Solutions", [["/service", "Services"], ["/products", "Products"], ["/portfolio", "Portfolio"]]], ["Company", [["/our-team", "Our Team"], ["/gallery", "Gallery"], ["/blogs", "Blogs"]]], ["Connect", [["/contact", "Contact Us"]]]].map(([h, links]) => (
              <div key={h as string} className="flex flex-col gap-3">
                <h4 className="text-title-md">{h as string}</h4>
                {(links as string[][]).map(([href, l]) => <Link key={href} href={href} className="text-body-sm text-on-surface-variant hover:text-on-surface">{l}</Link>)}
              </div>
            ))}
          </div>
          <p className="text-body-sm text-on-surface-variant">© {new Date().getFullYear()} {s.company_name}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
