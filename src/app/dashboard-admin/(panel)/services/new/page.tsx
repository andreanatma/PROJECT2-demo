import { ModuleForm } from "@/features/admin/module-pages";

export const metadata = { title: "Tambah services" };
export default function Page() {
  return <ModuleForm moduleKey="services" id={null} />;
}
