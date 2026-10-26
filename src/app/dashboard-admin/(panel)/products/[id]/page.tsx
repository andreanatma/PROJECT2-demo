import { notFound } from "next/navigation";
import { ModuleForm } from "@/features/admin/module-pages";

export const metadata = { title: "Edit products" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <ModuleForm moduleKey="products" id={id} />;
}
