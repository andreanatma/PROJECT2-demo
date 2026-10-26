import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, pageParam, str } from "@/lib/utils";
import { EmptyState, Icon, MediaImg, Pagination, StatusBadge } from "@/components/ui";
import { ConfirmButton } from "@/components/client";
import { deleteEntity } from "../crud-actions";
import { getModule, publicUrlFor, type ModuleKey } from "../modules";
import { EntityForm } from "./entity-form";

const PER_PAGE = 10;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const del = (model: string): any => (prisma as any)[model];

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-headline-xl">{title}</h1>
        {desc && <p className="mt-1 text-body-md text-on-surface-variant">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export async function ModuleList({ moduleKey, searchParams }: { moduleKey: ModuleKey; searchParams: Record<string, string | string[] | undefined> }) {
  await requireUser();
  const m = getModule(moduleKey)!;
  const q = str(searchParams.q).trim().slice(0, 100);
  const page = pageParam(searchParams.page);
  const where = q ? { OR: m.searchFields.map((f) => ({ [f]: { contains: q } })) } : {};
  const [total, rows] = await Promise.all([
    del(m.model).count({ where }),
    del(m.model).findMany({ where, orderBy: m.orderBy, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  return (
    <>
      <PageHeader title={m.label} desc={`${total} data tercatat.`} action={<Link href={`/dashboard-admin/${m.key}/new`} className="btn-accent"><Icon name="add" className="text-[20px]" />Tambah {m.singular}</Link>} />
      <form className="mb-4 flex gap-3" role="search">
        <div className="relative max-w-md flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-2.5 text-outline" />
          <input name="q" defaultValue={q} className="input !pl-10" placeholder={`Cari ${m.singular}…`} aria-label="Cari" />
        </div>
        <button className="btn-secondary">Cari</button>
        {q && <Link href={`/dashboard-admin/${m.key}`} className="btn-ghost">Reset</Link>}
      </form>
      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon="folder_open" title={q ? "Tidak ada hasil" : `Belum ada ${m.singular}`} text={q ? "Coba kata kunci lain." : `Tambahkan ${m.singular} pertama Anda.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-label-md text-[#64748B]">
                <tr>{m.columns.map((c) => <th key={c.key} scope="col" className="px-4 py-3">{c.label}</th>)}<th scope="col" className="px-4 py-3 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((r: Record<string, unknown>) => (
                  <tr key={String(r.id)} className="hover:bg-[#F8FAFC]">
                    {m.columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 align-middle">
                        {c.kind === "image" ? <MediaImg id={r[c.key] as number | null} alt="" className="h-10 w-14 rounded" /> :
                         c.kind === "date" ? formatDate(r[c.key] as Date | null) :
                         c.kind === "status" ? <StatusBadge value={String(r[c.key])} /> :
                         <span className={c.key === m.nameField ? "text-title-md" : "text-on-surface-variant"}>{String(r[c.key] ?? "-")}</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {publicUrlFor(m.key, r) ? (
                          <a href={publicUrlFor(m.key, r)!} target="_blank" rel="noopener" aria-label={`Lihat ${String(r[m.nameField])} di website`} title="Lihat di website" className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"><Icon name="open_in_new" className="text-[20px]" /></a>
                        ) : (
                          <span title="Draft: belum tampil di website. Buka Edit untuk pratinjau." className="rounded p-1.5 text-outline-variant"><Icon name="visibility_off" className="text-[20px]" /></span>
                        )}
                        <Link href={`/dashboard-admin/${m.key}/${r.id}`} aria-label={`Edit ${String(r[m.nameField])}`} className="rounded p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"><Icon name="edit" className="text-[20px]" /></Link>
                        <ConfirmButton action={deleteEntity.bind(null, m.key, r.id as number)} title={String(r[m.nameField])} text={`Hapus ${m.singular} ini? Tindakan ini tidak dapat dibatalkan.`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} pages={pages} basePath={`/dashboard-admin/${m.key}`} params={q ? { q } : undefined} />
    </>
  );
}

export async function ModuleForm({ moduleKey, id }: { moduleKey: ModuleKey; id: number | null }) {
  await requireUser();
  const m = getModule(moduleKey)!;
  let values: Record<string, string | number | null> = {};
  let viewUrl: string | null = null;
  const fileNames: Record<string, string> = {};
  if (id !== null) {
    const row = await del(m.model).findUnique({ where: { id } });
    if (!row) notFound();
    viewUrl = publicUrlFor(m.key, row);
    for (const f of m.fields) {
      const v = row[f.name];
      values[f.name] = f.type === "date" ? (v ? new Date(v).toISOString().slice(0, 10) : "") : v ?? "";
    }
    const ids = m.mediaFields.map((k) => row[k]).filter(Boolean) as number[];
    if (ids.length) {
      const files = await prisma.mediaFile.findMany({ where: { id: { in: ids } } });
      for (const k of m.mediaFields) { const f = files.find((x) => x.id === row[k]); if (f) fileNames[k] = f.originalName; }
    }
  } else {
    values = { status: "DRAFT", displayOrder: 0 };
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title={id ? `Edit ${m.singular}` : `Tambah ${m.singular}`} action={<div className="flex gap-2">{id !== null && (viewUrl ? <a href={viewUrl} target="_blank" rel="noopener" className="btn-secondary"><Icon name="open_in_new" className="text-[18px]" />Lihat di website</a> : m.key === "blogs" ? <a href={`/blogs/${values.slug}`} target="_blank" rel="noopener" className="btn-secondary"><Icon name="visibility" className="text-[18px]" />Pratinjau draft</a> : null)}<Link href={`/dashboard-admin/${m.key}`} className="btn-ghost"><Icon name="arrow_back" className="text-[18px]" />Kembali</Link></div>} />
      <EntityForm moduleKey={m.key} id={id} fields={m.fields} values={values} fileNames={fileNames} />
    </div>
  );
}
