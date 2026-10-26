import { ModuleList } from "@/features/admin/module-pages";

export const metadata = { title: "blogs" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ModuleList moduleKey="blogs" searchParams={await searchParams} />;
}
