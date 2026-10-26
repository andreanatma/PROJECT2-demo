"use client";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return <div role="alert" className="container-x py-24 text-center"><h1 className="text-headline-xl">Terjadi kesalahan</h1><p className="mt-3 text-body-lg text-on-surface-variant">Halaman gagal dimuat. Silakan coba lagi.</p><button onClick={reset} className="btn-primary mt-6">Coba lagi</button></div>;
}
