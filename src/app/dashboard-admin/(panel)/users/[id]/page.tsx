import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/features/admin/module-pages";
import { UserForm } from "@/features/admin/forms";

export const metadata = { title: "Edit pengguna" };
export default async function EditUser({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) notFound();
  return <><PageHeader title="Edit pengguna" /><UserForm user={{ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive }} /></>;
}
