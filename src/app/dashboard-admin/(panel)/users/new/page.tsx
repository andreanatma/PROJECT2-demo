import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/features/admin/module-pages";
import { UserForm } from "@/features/admin/forms";

export const metadata = { title: "Tambah administrator" };
export default async function NewUser() {
  await requireSuperAdmin();
  return <><PageHeader title="Tambah administrator" /><UserForm /></>;
}
