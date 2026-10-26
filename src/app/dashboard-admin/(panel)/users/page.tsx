import Link from "next/link";
import { cookies } from "next/headers";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Icon, StatusBadge } from "@/components/ui";
import { ConfirmButton } from "@/components/client";
import { PageHeader } from "@/features/admin/module-pages";
import { deleteUser, resetUserPassword } from "@/features/admin-actions";

export const metadata = { title: "Users" };

export default async function Users() {
  const me = await requireSuperAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const flash = (await cookies()).get("apex_flash_pw")?.value; // ditampilkan sekali; cookie kedaluwarsa 60 detik
  const [flashEmail, flashPw] = flash ? flash.split("|") : [];
  return (
    <>
      <PageHeader title="Users" desc="Kelola akun administrator dan role." action={<Link href="/dashboard-admin/users/new" className="btn-accent"><Icon name="person_add" className="text-[20px]" />Tambah administrator</Link>} />
      {flashPw && (
        <div role="status" className="mb-4 rounded border border-accent bg-[#FEF3C7] p-4 text-body-sm text-[#92400E]">
          Kata sandi sementara untuk <strong>{flashEmail}</strong>: <code className="rounded bg-white px-2 py-0.5 text-navy">{flashPw}</code>. Salin sekarang — tidak akan ditampilkan lagi. Semua sesi pengguna tersebut telah dihentikan.
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-label-md text-[#64748B]"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Login terakhir</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y divide-[#F1F5F9]">{users.map((u) => (
            <tr key={u.id} className="hover:bg-[#F8FAFC]">
              <td className="px-4 py-3"><p className="text-title-md">{u.name}{u.id === me.id && <span className="ml-2 text-body-sm font-normal text-outline">(Anda)</span>}</p><p className="text-on-surface-variant">{u.email}</p></td>
              <td className="px-4 py-3"><StatusBadge value={u.role} /></td>
              <td className="px-4 py-3">{u.isActive ? <span className="badge-success">Aktif</span> : <span className="badge-warn">Nonaktif</span>}</td>
              <td className="px-4 py-3 tabular-nums">{formatDate(u.lastLoginAt, true)}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-1">
                <Link href={`/dashboard-admin/users/${u.id}`} aria-label={`Edit ${u.name}`} className="rounded p-1.5 hover:bg-surface-container hover:text-primary"><Icon name="edit" className="text-[20px]" /></Link>
                <ConfirmButton label="Reset" action={resetUserPassword.bind(null, u.id)} title={`Reset kata sandi ${u.name}`} text="Kata sandi acak sementara akan dibuat dan semua sesi pengguna ini dihentikan." />
                {u.id !== me.id && <ConfirmButton action={deleteUser.bind(null, u.id)} title={u.name} text="Akun ini akan dihapus permanen. Riwayat aktivitasnya tetap tersimpan tanpa nama pengguna." />}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
