import { ModuleList } from "@/features/admin/module-pages";

export const metadata = { title: "portfolio" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ModuleList moduleKey="portfolio" searchParams={await searchParams} />;
}
