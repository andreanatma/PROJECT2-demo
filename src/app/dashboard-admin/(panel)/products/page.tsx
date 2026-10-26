import { ModuleList } from "@/features/admin/module-pages";

export const metadata = { title: "products" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ModuleList moduleKey="products" searchParams={await searchParams} />;
}
