"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="card mx-auto max-w-lg p-8 text-center">
      <h2 className="text-headline-md">Terjadi kesalahan</h2>
      <p className="mt-2 text-body-md text-on-surface-variant">Halaman gagal dimuat. Periksa koneksi database lalu coba lagi.</p>
      <button onClick={reset} className="btn-primary mt-5">Coba lagi</button>
    </div>
  );
}
