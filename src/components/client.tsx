"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Icon } from "./ui";
import { pingSession } from "@/features/auth-actions";
import { uploadMedia } from "@/features/crud-actions";

export function SubmitButton({ children, className = "btn-primary", pendingText = "Menyimpan…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

/** Toast dari query ?msg=. Dibersihkan dari URL setelah tampil. */
export function Toast() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const msg = sp.get("msg");
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    setText(msg);
    const q = new URLSearchParams(sp.toString());
    q.delete("msg");
    router.replace(q.size ? `${path}?${q}` : path, { scroll: false });
    const t = setTimeout(() => setText(null), 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg]);
  if (!text) return null;
  const bad = /gagal|ditolak|tidak dapat|tidak ditemukan|masih dipakai/i.test(text);
  return (
    <div role="status" aria-live="polite" className={`fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.07)] ${bad ? "border-error/40" : "border-[#E2E8F0]"}`}>
      <Icon name={bad ? "error" : "check_circle"} fill className={bad ? "text-error" : "text-emerald-600"} />
      <p className="text-body-sm text-navy">{text}</p>
      <button onClick={() => setText(null)} aria-label="Tutup notifikasi" className="text-outline hover:text-navy"><Icon name="close" className="text-[18px]" /></button>
    </div>
  );
}

/** Tombol hapus dengan modal konfirmasi. `action` adalah server action yang sudah di-bind. */
export function ConfirmButton({ action, label = "Hapus", title, text, variant = "icon" }: { action: () => Promise<void>; label?: string; title: string; text: string; variant?: "icon" | "button" }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);
  return (
    <>
      {variant === "icon" ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={`${label}: ${title}`} className="rounded p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error"><Icon name="delete" className="text-[20px]" /></button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary !text-error">{label}</button>
      )}
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/40 p-4" onClick={() => setOpen(false)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="cd-t" className="w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1)]" onClick={(e) => e.stopPropagation()}>
            <h3 id="cd-t" className="text-title-lg">{title}</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">{text}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button ref={ref} className="btn-secondary" onClick={() => setOpen(false)}>Batal</button>
              <button className="btn-danger" disabled={pending} onClick={() => start(async () => { await action(); })}>{pending ? "Menghapus…" : label}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Upload gambar/PDF dengan preview. Menyimpan ID media di input hidden. */
export function FileField({ name, kind, initialId, initialName, error }: { name: string; kind: "image" | "pdf"; initialId?: number | null; initialName?: string; error?: string }) {
  const [id, setId] = useState<number | null>(initialId ?? null);
  const [info, setInfo] = useState<{ name: string; size?: number } | null>(initialId ? { name: initialName ?? `File #${initialId}` } : null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setBusy(true);
    const fd = new FormData();
    fd.set("file", f);
    try {
      const r = await uploadMedia(kind, true, fd);
      if (r.ok && r.id) { setId(r.id); setInfo({ name: r.name ?? f.name, size: r.size }); } else setErr(r.error ?? "Upload gagal.");
    } catch { setErr("Upload gagal. Periksa ukuran file dan koneksi."); }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name={name} value={id ?? ""} />
      <div className="flex items-center gap-4 rounded border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-3">
        {kind === "image" ? (
          id ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/${id}`} alt="Preview" className="h-20 w-28 rounded object-cover" /> : <div className="flex h-20 w-28 items-center justify-center rounded bg-surface-container text-outline"><Icon name="image" className="text-[32px]" /></div>
        ) : (
          <div className="flex h-20 w-28 items-center justify-center rounded bg-surface-container text-primary"><Icon name="picture_as_pdf" className="text-[32px]" /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-md">{info ? info.name : "Belum ada file"}</p>
          <p className="text-body-sm text-on-surface-variant">{info?.size ? `${(info.size / 1024).toFixed(0)} KB · ` : ""}{kind === "image" ? "JPG, PNG, WebP, GIF" : "PDF"}</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-secondary !px-3 !py-1.5" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "Mengunggah…" : id ? "Ganti file" : "Pilih file"}</button>
            {id && <button type="button" className="btn-ghost !px-3 !py-1.5" onClick={() => { setId(null); setInfo(null); }}>Lepas</button>}
            {kind === "pdf" && id && <a href={`/media/${id}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5">Buka</a>}
          </div>
        </div>
        <input ref={inputRef} type="file" className="sr-only" accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : "application/pdf"} onChange={onPick} aria-label="Pilih file" />
      </div>
      {(err || error) && <p role="alert" className="mt-1 text-body-sm text-error">{err ?? error}</p>}
    </div>
  );
}

const IDLE_MS = 60 * 60_000;
/** Sinyal aktivitas dari UI. Perpanjangan sesi tetap diputuskan server; ini hanya memberi tahu server dan menampilkan peringatan. */
export function IdleGuard() {
  const router = useRouter();
  const last = useRef(Date.now());
  const lastPing = useRef(Date.now());
  const [warn, setWarn] = useState(false);
  useEffect(() => {
    const bump = () => { last.current = Date.now(); setWarn(false); };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const iv = setInterval(async () => {
      const idle = Date.now() - last.current;
      if (idle >= IDLE_MS) { router.replace("/dashboard-admin/login?reason=expired"); return; }
      setWarn(idle >= IDLE_MS - 5 * 60_000);
      if (idle < 60_000 && Date.now() - lastPing.current > 5 * 60_000) {
        lastPing.current = Date.now();
        const r = await pingSession().catch(() => ({ valid: true }));
        if (!r.valid) router.replace("/dashboard-admin/login?reason=expired");
      }
    }, 15_000);
    return () => { events.forEach((e) => window.removeEventListener(e, bump)); clearInterval(iv); };
  }, [router]);
  if (!warn) return null;
  return <div role="alert" className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-lg border border-accent bg-[#FEF3C7] px-4 py-2 text-body-sm text-[#92400E] shadow">Sesi akan berakhir dalam beberapa menit karena tidak ada aktivitas. Gerakkan kursor atau klik untuk melanjutkan.</div>;
}

export function Lightbox({ items }: { items: { id: number; title: string; description: string | null; imageId: number | null }[] }) {
  const [i, setI] = useState<number | null>(null);
  useEffect(() => {
    if (i === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setI(null);
      if (e.key === "ArrowRight") setI((v) => (v === null ? v : (v + 1) % items.length));
      if (e.key === "ArrowLeft") setI((v) => (v === null ? v : (v - 1 + items.length) % items.length));
    };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [i, items.length]);
  const cur = i === null ? null : items[i];
  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it, idx) => (
          <button key={it.id} onClick={() => setI(idx)} className="group card overflow-hidden text-left transition-shadow hover:shadow-md">
            <div className="relative h-64 overflow-hidden bg-surface-container">
              {it.imageId ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/${it.imageId}`} alt={it.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-primary/40"><Icon name="image" className="text-[40px]" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-4 right-4 text-headline-md text-white">{it.title}</h3>
            </div>
            {it.description && <p className="line-clamp-2 p-5 text-body-sm text-on-surface-variant">{it.description}</p>}
          </button>
        ))}
      </div>
      {cur && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/80 p-4" onClick={() => setI(null)}>
          <div role="dialog" aria-modal="true" aria-label={cur.title} className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3">
              <h3 className="text-title-lg">{cur.title}</h3>
              <button onClick={() => setI(null)} aria-label="Tutup" className="rounded p-1 hover:bg-[#F1F5F9]"><Icon name="close" /></button>
            </div>
            <div className="flex max-h-[60vh] justify-center bg-inverse-surface">{cur.imageId && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/${cur.imageId}`} alt={cur.title} className="max-h-[60vh] w-auto object-contain" />}</div>
            {cur.description && <p className="p-5 text-body-md text-on-surface-variant">{cur.description}</p>}
            <div className="flex justify-between border-t border-[#E2E8F0] px-5 py-3">
              <button className="btn-ghost" onClick={() => setI((i! - 1 + items.length) % items.length)}>Sebelumnya</button>
              <button className="btn-ghost" onClick={() => setI((i! + 1) % items.length)}>Berikutnya</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
