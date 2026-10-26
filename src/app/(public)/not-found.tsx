import Link from "next/link";

export default function NotFound() {
  return <div className="container-x py-24 text-center"><h1 className="text-display-md">Halaman tidak ditemukan</h1><p className="mt-3 text-body-lg text-on-surface-variant">Konten yang Anda cari tidak ada atau belum dipublikasikan.</p><Link href="/" className="btn-primary mt-6">Kembali ke beranda</Link></div>;
}
