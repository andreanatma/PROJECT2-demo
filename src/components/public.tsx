import Link from "next/link";
import { Icon } from "./ui";

export function PageHero({ eyebrow, title, text, icon = "verified" }: { eyebrow: string; title: string; text: string; icon?: string }) {
  return (
    <section className="bg-gradient-to-b from-surface-container-low via-surface to-surface pb-12 pt-12">
      <div className="container-x">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface-container-highest px-3.5 py-1.5 text-label-md uppercase tracking-wider text-primary"><Icon name={icon} className="text-[16px]" />{eyebrow}</span>
        <h1 className="max-w-4xl text-display-md-mobile tracking-tight md:text-display-md">{title}</h1>
        <p className="mt-4 max-w-3xl text-body-lg text-on-surface-variant">{text}</p>
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, href, linkText }: { eyebrow: string; title: string; href?: string; linkText?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div><span className="text-label-md uppercase tracking-wider text-primary">{eyebrow}</span><h2 className="mt-2 text-headline-xl">{title}</h2></div>
      {href && <Link href={href} className="inline-flex items-center gap-1 text-title-md text-primary hover:text-primary-container">{linkText}<Icon name="arrow_forward" className="text-[18px]" /></Link>}
    </div>
  );
}

export function CtaBand({ title, text }: { title: string; text: string }) {
  return (
    <section className="container-x mt-20">
      <div className="relative overflow-hidden rounded-xl bg-navy p-10 text-white lg:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-container/25 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl"><h2 className="text-headline-xl md:text-display-md">{title}</h2><p className="mt-3 text-body-lg text-slate-300">{text}</p></div>
          <Link href="/contact" className="btn-accent !px-8 !py-3.5">Mulai konsultasi<Icon name="arrow_forward" className="text-[20px]" /></Link>
        </div>
      </div>
    </section>
  );
}
