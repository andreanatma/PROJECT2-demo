import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { LoginForm } from "@/features/admin/forms";
import { DEMO_ADMIN } from "@/lib/mock-seed";

export const metadata: Metadata = { title: "Masuk Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NOTES: Record<string, string> = { expired: "Sesi berakhir karena tidak ada aktivitas selama 60 menit atau Anda belum masuk. Silakan masuk kembali.", logout: "Anda telah keluar.", created: "Super Admin berhasil dibuat. Silakan masuk." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  if (await getSession()) redirect("/dashboard-admin");
  const { reason } = await searchParams;
  const note = reason ? NOTES[reason] : undefined;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_20px_25px_-5px_rgba(15,23,42,0.1)] lg:grid-cols-5">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[#0B132B] via-navy to-[#1E293B] p-8 text-white lg:col-span-2 lg:flex">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container"><Icon name="shield_person" /></span><span className="text-title-lg font-bold">Apex Global</span></div>
          <div><h2 className="text-headline-lg">Portal administrasi</h2><p className="mt-2 text-body-sm text-slate-300">Kelola konten website, pesan kontak, dan pengguna. Setiap aktivitas dicatat di audit trail.</p></div>
          <p className="text-label-md text-slate-400">Sesi otomatis berakhir setelah 60 menit tanpa aktivitas.</p>
        </div>
        <div className="p-8 lg:col-span-3 lg:p-10">
          <h1 className="text-headline-xl">Masuk administrator</h1>
          <p className="mb-6 mt-1 text-body-sm text-on-surface-variant">Gunakan akun yang diberikan Super Admin.</p>
          {note && <div role="status" className="mb-4 rounded border border-primary-fixed-dim bg-[#EFF6FF] px-4 py-3 text-body-sm text-[#1E40AF]">{note}</div>}
          {DEMO_ADMIN.enabled && DEMO_ADMIN.isDefault && (
            <div role="note" className="mb-4 rounded border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-body-sm text-[#92400E]">
              <strong>Mode demo (tanpa database).</strong> Masuk dengan <code>{DEMO_ADMIN.email}</code> / <code>{DEMO_ADMIN.password}</code>. Data perubahan hilang saat server restart.
            </div>
          )}
          <LoginForm />
          <Link href="/" className="mt-6 inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-navy"><Icon name="arrow_back" className="text-[16px]" />Kembali ke website</Link>
        </div>
      </div>
    </main>
  );
}
