import { getSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";
import { Icon } from "@/components/ui";
import { PageHero } from "@/components/public";
import { ContactForm } from "./contact-form";

export const generateMetadata = () => buildMetadata({ pageKey: "contact", title: "Hubungi Kami", path: "/contact" });

export default async function Contact() {
  const s = await getSettings();
  const items = [["mail", "Email", s.email, `mailto:${s.email}`], ["call", "Telepon", s.phone, `tel:${s.phone.replace(/[^+\d]/g, "")}`], ...(s.whatsapp ? [["chat", "WhatsApp", `+${s.whatsapp}`, `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`]] : []), ["location_on", "Alamat", s.address, ""], ["schedule", "Jam operasional", s.office_hours, ""]];
  return (
    <>
      <PageHero eyebrow="Komunikasi dan konsultasi" title="Mari berkolaborasi: diskusikan kebutuhan digital perusahaan Anda" text="Kirim pesan dan tim kami akan menghubungi Anda. Pesan tersimpan dengan aman di sistem kami." icon="headset_mic" />
      <section className="container-x grid items-start gap-8 lg:grid-cols-12">
        <div className="card p-6 sm:p-10 lg:col-span-7"><h2 className="mb-6 text-headline-xl">Kirim pesan</h2><ContactForm /></div>
        <aside className="card space-y-5 p-6 lg:col-span-5" aria-label="Informasi kontak">
          {items.map(([i, l, v, h]) => (
            <div key={l} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-surface-container text-primary"><Icon name={i} className="text-[20px]" /></span><div><p className="text-label-md text-[#64748B]">{l}</p>{h ? <a href={h} className="text-title-md hover:text-primary">{v}</a> : <p className="text-body-md">{v}</p>}</div></div>
          ))}
        </aside>
      </section>
    </>
  );
}
