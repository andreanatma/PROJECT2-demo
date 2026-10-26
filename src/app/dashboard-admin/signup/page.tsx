import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SignupForm } from "@/features/admin/forms";

export const metadata: Metadata = { title: "Setup Super Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const me = await getSession();
  if (me) redirect(me.role === "SUPER_ADMIN" ? "/dashboard-admin/users/new" : "/dashboard-admin");
  const count = await prisma.user.count();
  const enabled = count === 0 && !!process.env.BOOTSTRAP_TOKEN;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-headline-xl">Setup Super Admin pertama</h1>
        {enabled ? (
          <>
            <p className="mb-6 mt-1 text-body-sm text-on-surface-variant">Halaman ini hanya aktif selama belum ada pengguna dan memerlukan BOOTSTRAP_TOKEN dari server.</p>
            <SignupForm />
          </>
        ) : (
          <div className="mt-4 space-y-3 text-body-md text-on-surface-variant">
            <p>{count > 0 ? "Pendaftaran publik ditutup. Super Admin dapat menambah administrator dari menu Users setelah masuk." : "BOOTSTRAP_TOKEN belum diatur di server, sehingga pendaftaran dinonaktifkan. Atur variabel tersebut atau jalankan `npm run admin:create`."}</p>
            <Link href="/dashboard-admin/login" className="btn-primary">Ke halaman masuk</Link>
          </div>
        )}
      </div>
    </main>
  );
}
