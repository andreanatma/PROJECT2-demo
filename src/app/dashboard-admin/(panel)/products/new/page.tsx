import { ModuleForm } from "@/features/admin/module-pages";

export const metadata = { title: "Tambah products" };
export default function Page() {
  return <ModuleForm moduleKey="products" id={null} />;
}
