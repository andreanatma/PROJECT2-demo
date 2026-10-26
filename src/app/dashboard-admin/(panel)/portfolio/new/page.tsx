import { ModuleForm } from "@/features/admin/module-pages";

export const metadata = { title: "Tambah portfolio" };
export default function Page() {
  return <ModuleForm moduleKey="portfolio" id={null} />;
}
