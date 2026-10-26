"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton, FileField } from "@/components/client";
import { changeOwnPassword, loginAction, bootstrapSignupAction } from "../auth-actions";
import { createUser, saveSeo, saveSettings, updateUser, uploadToLibrary } from "../admin-actions";
import type { FormState } from "../crud-actions";
import { SETTING_FIELDS } from "@/lib/settings-fields";

const init: FormState = { ok: false };

function Msg({ s }: { s: FormState }) {
  if (!s.message) return null;
  return <div role={s.ok ? "status" : "alert"} className={`rounded border px-4 py-3 text-body-sm ${s.ok ? "border-emerald-300 bg-[#ECFDF5] text-[#065F46]" : "border-error/30 bg-error-container text-on-error-container"}`}>{s.message}</div>;
}
function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {children}
      {error && <p id={`${name}-e`} role="alert" className="mt-1 text-body-sm text-error">{error}</p>}
    </div>
  );
}

export function LoginForm() {
  const [s, a] = useActionState(loginAction, init);
  return (
    <form action={a} className="space-y-4">
      <Msg s={s} />
      <Field label="Email" name="email"><input id="email" name="email" type="email" required autoComplete="username" className="input" placeholder="nama@perusahaan.com" /></Field>
      <Field label="Kata sandi" name="password"><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></Field>
      <SubmitButton className="btn-accent w-full !py-3" pendingText="Memeriksa…">Masuk ke dashboard</SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const [s, a] = useActionState(bootstrapSignupAction, init);
  const e = s.errors ?? {};
  return (
    <form action={a} className="space-y-4">
      <Msg s={s} />
      <Field label="Nama lengkap" name="name" error={e.name}><input id="name" name="name" required className="input" autoComplete="name" /></Field>
      <Field label="Email" name="email" error={e.email}><input id="email" name="email" type="email" required className="input" autoComplete="username" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kata sandi (min. 10 karakter)" name="password" error={e.password}><input id="password" name="password" type="password" required className="input" autoComplete="new-password" /></Field>
        <Field label="Konfirmasi kata sandi" name="confirm" error={e.confirm}><input id="confirm" name="confirm" type="password" required className="input" autoComplete="new-password" /></Field>
      </div>
      <Field label="Token bootstrap (BOOTSTRAP_TOKEN)" name="token" error={e.token}><input id="token" name="token" type="password" required className="input" autoComplete="off" /></Field>
      <SubmitButton className="btn-accent w-full !py-3">Buat Super Admin</SubmitButton>
    </form>
  );
}

export function UserForm({ user }: { user?: { id: number; name: string; email: string; role: string; isActive: boolean } }) {
  const [s, a] = useActionState(user ? updateUser.bind(null, user.id) : createUser, init);
  const e = s.errors ?? {};
  return (
    <form action={a} className="card max-w-2xl space-y-5 p-6">
      <Msg s={s} />
      <Field label="Nama" name="name" error={e.name}><input id="name" name="name" required defaultValue={user?.name} className="input" /></Field>
      <Field label="Email" name="email" error={e.email}><input id="email" name="email" type="email" required defaultValue={user?.email} className="input" /></Field>
      <Field label="Role" name="role" error={e.role}>
        <select id="role" name="role" defaultValue={user?.role ?? "ADMIN"} className="input"><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super Admin</option></select>
      </Field>
      {user ? (
        <label className="flex items-center gap-3 text-body-md"><input type="checkbox" name="isActive" defaultChecked={user.isActive} className="h-[18px] w-[18px] accent-primary-container" />Akun aktif</label>
      ) : (
        <Field label="Kata sandi awal (min. 10 karakter, huruf + angka)" name="password" error={e.password}><input id="password" name="password" type="password" required autoComplete="new-password" className="input" /></Field>
      )}
      <div className="flex justify-end gap-3 border-t border-[#F1F5F9] pt-5"><Link href="/dashboard-admin/users" className="btn-secondary">Batal</Link><SubmitButton>Simpan</SubmitButton></div>
    </form>
  );
}

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [s, a] = useActionState(saveSettings, init);
  return (
    <form action={a} className="card max-w-3xl space-y-5 p-6">
      <Msg s={s} />
      {SETTING_FIELDS.map((f) => (
        <Field key={f.key} label={f.label} name={f.key} error={s.errors?.[f.key]}>
          {f.type === "textarea" ? <textarea id={f.key} name={f.key} rows={3} defaultValue={values[f.key]} className="input" maxLength={1000} /> : <input id={f.key} name={f.key} defaultValue={values[f.key]} className="input" maxLength={1000} />}
        </Field>
      ))}
      <div className="flex justify-end border-t border-[#F1F5F9] pt-5"><SubmitButton>Simpan pengaturan</SubmitButton></div>
    </form>
  );
}

export function PasswordForm() {
  const [s, a] = useActionState(changeOwnPassword, init);
  const e = s.errors ?? {};
  return (
    <form action={a} className="card max-w-3xl space-y-5 p-6">
      <h2 className="text-title-lg">Ganti kata sandi saya</h2>
      <Msg s={s} />
      <Field label="Kata sandi saat ini" name="current" error={e.current}><input id="current" name="current" type="password" required autoComplete="current-password" className="input" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kata sandi baru" name="password" error={e.password}><input id="password" name="password" type="password" required autoComplete="new-password" className="input" /></Field>
        <Field label="Konfirmasi" name="confirm" error={e.confirm}><input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" /></Field>
      </div>
      <div className="flex justify-end"><SubmitButton>Ganti kata sandi</SubmitButton></div>
    </form>
  );
}

export function SeoForm({ pages, rows, names }: { pages: { key: string; label: string; path: string }[]; rows: Record<string, { title: string; description: string; ogImageId: number | null; noindex: boolean }>; names: Record<string, string> }) {
  const [s, a] = useActionState(saveSeo, init);
  return (
    <form action={a} className="max-w-3xl space-y-5">
      <Msg s={s} />
      {pages.map((p) => {
        const r = rows[p.key];
        return (
          <fieldset key={p.key} className="card space-y-4 p-6">
            <legend className="sr-only">{p.label}</legend>
            <div className="flex items-center justify-between"><h2 className="text-title-lg">{p.label}</h2><code className="text-body-sm text-outline">{p.path}</code></div>
            <Field label="Title" name={`${p.key}__title`}><input id={`${p.key}__title`} name={`${p.key}__title`} defaultValue={r?.title} maxLength={160} className="input" placeholder="Kosongkan untuk judul bawaan" /></Field>
            <Field label="Description" name={`${p.key}__description`}><textarea id={`${p.key}__description`} name={`${p.key}__description`} defaultValue={r?.description} maxLength={320} rows={2} className="input" /></Field>
            <div><span className="label">Gambar Open Graph</span><FileField name={`${p.key}__ogImageId`} kind="image" initialId={r?.ogImageId} initialName={names[p.key]} /></div>
            <label className="flex items-center gap-3 text-body-md"><input type="checkbox" name={`${p.key}__noindex`} defaultChecked={r?.noindex} className="h-[18px] w-[18px] accent-primary-container" />Jangan indeks halaman ini (noindex)</label>
          </fieldset>
        );
      })}
      <div className="flex justify-end"><SubmitButton>Simpan SEO</SubmitButton></div>
    </form>
  );
}

export function MediaUploadForm() {
  const [s, a] = useActionState(uploadToLibrary, init);
  return (
    <form action={a} className="card mb-6 flex flex-wrap items-end gap-4 p-5">
      <div className="min-w-[240px] flex-1"><label className="label" htmlFor="file">File (JPG, PNG, WebP, GIF, PDF)</label><input id="file" name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" className="input !h-auto py-2" /></div>
      <div><label className="label" htmlFor="visibility">Akses</label><select id="visibility" name="visibility" className="input"><option value="public">Publik</option><option value="private">Privat (hanya admin)</option></select></div>
      <SubmitButton pendingText="Mengunggah…">Unggah</SubmitButton>
      {s.message && <p role={s.ok ? "status" : "alert"} className={`w-full text-body-sm ${s.ok ? "text-[#065F46]" : "text-error"}`}>{s.message}</p>}
    </form>
  );
}
