import { ModuleList } from "@/features/admin/module-pages";

export const metadata = { title: "services" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ModuleList moduleKey="services" searchParams={await searchParams} />;
}
