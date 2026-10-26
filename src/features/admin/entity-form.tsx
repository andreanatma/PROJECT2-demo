"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FieldDef } from "../modules";
import { saveEntity, type FormState } from "../crud-actions";
import { FileField, SubmitButton } from "@/components/client";

const initial: FormState = { ok: false };

export function EntityForm({ moduleKey, id, fields, values, fileNames }: { moduleKey: string; id: number | null; fields: FieldDef[]; values: Record<string, string | number | null>; fileNames: Record<string, string> }) {
  const [state, action] = useActionState(saveEntity.bind(null, moduleKey, id), initial);
  const main = fields.filter((f) => f.group !== "seo");
  const seo = fields.filter((f) => f.group === "seo");

  const render = (f: FieldDef) => {
    const err = state.errors?.[f.name];
    const v = values[f.name] ?? "";
    const common = { id: f.name, name: f.name, "aria-invalid": !!err, "aria-describedby": err ? `${f.name}-e` : undefined } as const;
    return (
      <div key={f.name}>
        <label className="label" htmlFor={f.name}>{f.label}{f.required && <span className="text-error"> *</span>}</label>
        {f.type === "image" || f.type === "pdf" ? (
          <FileField name={f.name} kind={f.type === "pdf" ? "pdf" : "image"} initialId={v ? Number(v) : null} initialName={fileNames[f.name]} error={err} />
        ) : f.type === "textarea" || f.type === "longtext" ? (
          <textarea {...common} className="input" rows={f.rows ?? 4} maxLength={f.max} defaultValue={String(v)} placeholder={f.placeholder} />
        ) : f.type === "select" ? (
          <select {...common} className="input" defaultValue={String(v || f.options?.[0]?.value)}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        ) : (
          <input {...common} className="input" type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} min={f.type === "number" ? 0 : undefined} maxLength={f.max} defaultValue={String(v)} placeholder={f.placeholder} />
        )}
        {f.help && !err && <p className="mt-1 text-body-sm text-on-surface-variant">{f.help}</p>}
        {err && f.type !== "image" && f.type !== "pdf" && <p id={`${f.name}-e`} role="alert" className="mt-1 text-body-sm text-error">{err}</p>}
      </div>
    );
  };

  return (
    <form action={action} className="card space-y-5 p-6">
      {state.message && !state.ok && <div role="alert" className="rounded border border-error/30 bg-error-container px-4 py-3 text-body-sm text-on-error-container">{state.message}</div>}
      {main.map(render)}
      {seo.length > 0 && (
        <fieldset className="space-y-5 rounded border border-[#E2E8F0] p-4">
          <legend className="px-2 text-label-md text-on-surface-variant">Pengaturan SEO</legend>
          {seo.map(render)}
        </fieldset>
      )}
      <div className="flex justify-end gap-3 border-t border-[#F1F5F9] pt-5">
        <Link href={`/dashboard-admin/${moduleKey}`} className="btn-secondary">Batal</Link>
        <SubmitButton>Simpan</SubmitButton>
      </div>
    </form>
  );
}
