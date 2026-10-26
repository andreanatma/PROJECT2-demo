import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Icon, StatusBadge } from "@/components/ui";
import { ConfirmButton } from "@/components/client";
import { PageHeader } from "@/features/admin/module-pages";
import { deleteMessage, setMessageStatus } from "@/features/admin-actions";

export const metadata = { title: "Detail pesan" };

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  let m = await prisma.contactMessage.findUnique({ where: { id } });
  if (!m) notFound();
  if (m.status === "UNREAD") m = await prisma.contactMessage.update({ where: { id }, data: { status: "READ" } });
  void me;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Detail pesan" action={<Link href="/dashboard-admin/contact" className="btn-ghost"><Icon name="arrow_back" className="text-[18px]" />Kembali</Link>} />
      <article className="card p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-label-md text-[#64748B]">Nama</dt><dd className="text-title-md">{m.name}</dd></div>
          <div><dt className="text-label-md text-[#64748B]">Email</dt><dd><a className="text-primary hover:underline" href={`mailto:${m.email}`}>{m.email}</a></dd></div>
          <div><dt className="text-label-md text-[#64748B]">Diterima</dt><dd>{formatDate(m.createdAt, true)}</dd></div>
          <div><dt className="text-label-md text-[#64748B]">Status</dt><dd><StatusBadge value={m.status} /></dd></div>
        </dl>
        <h2 className="mb-2 mt-6 text-label-md text-[#64748B]">Pesan</h2>
        <p className="whitespace-pre-wrap rounded bg-[#F8FAFC] p-4 text-body-md">{m.message}</p>
        <p className="mt-4 text-body-sm text-on-surface-variant">Sistem tidak mengirim email balasan otomatis. Gunakan tombol email di bawah, lalu tandai sebagai “Dibalas” setelah Anda membalas.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#F1F5F9] pt-5">
          <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: pesan Anda ke Apex Global")}`} className="btn-accent"><Icon name="reply" className="text-[20px]" />Balas lewat email</a>
          {m.status !== "REPLIED" && <form action={setMessageStatus.bind(null, m.id, "REPLIED")}><button className="btn-secondary">Tandai dibalas</button></form>}
          {m.status !== "UNREAD" && <form action={setMessageStatus.bind(null, m.id, "UNREAD")}><button className="btn-ghost">Tandai belum dibaca</button></form>}
          <div className="ml-auto"><ConfirmButton variant="button" action={deleteMessage.bind(null, m.id)} title={`Pesan dari ${m.name}`} text="Pesan ini akan dihapus permanen." /></div>
        </div>
      </article>
    </div>
  );
}
