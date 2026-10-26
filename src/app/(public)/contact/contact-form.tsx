"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/client";
import { submitContact } from "@/features/public-actions";
import type { FormState } from "@/features/crud-actions";

const init: FormState = { ok: false };

export function ContactForm() {
  const [s, a] = useActionState(submitContact, init);
  const e = s.errors ?? {};
  if (s.ok) return <div role="status" className="rounded-lg border border-emerald-300 bg-[#ECFDF5] p-6 text-[#065F46]"><h2 className="text-title-lg">Pesan terkirim</h2><p className="mt-1 text-body-md">{s.message}</p></div>;
  return (
    <form action={a} className="space-y-5" noValidate>
      {s.message && <div role="alert" className="rounded border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">{s.message}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Nama lengkap</label><input id="name" name="name" required maxLength={120} className="input" autoComplete="name" aria-invalid={!!e.name} />{e.name && <p role="alert" className="mt-1 text-body-sm text-error">{e.name}</p>}</div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required maxLength={190} className="input" autoComplete="email" aria-invalid={!!e.email} />{e.email && <p role="alert" className="mt-1 text-body-sm text-error">{e.email}</p>}</div>
      </div>
      <div><label className="label" htmlFor="message">Pesan</label><textarea id="message" name="message" required rows={6} maxLength={2000} className="input" aria-invalid={!!e.message} placeholder="Ceritakan kebutuhan sistem, tantangan, atau target Anda." />{e.message && <p role="alert" className="mt-1 text-body-sm text-error">{e.message}</p>}</div>
      <div className="absolute -left-[9999px]" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <SubmitButton className="btn-accent w-full !py-3.5" pendingText="Mengirim…">Kirim pesan</SubmitButton>
    </form>
  );
}
