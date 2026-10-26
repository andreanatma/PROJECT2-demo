import Link from "next/link";
import { cn } from "@/lib/utils";

export function Icon({ name, className, fill }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("icon", className)} style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>
      {name}
    </span>
  );
}

export function MediaImg({ id, alt, className, icon = "image" }: { id?: number | null; alt: string; className?: string; icon?: string }) {
  if (!id) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-surface-container to-surface-container-high text-primary/40", className)} role="img" aria-label={alt}>
        <Icon name={icon} className="text-[40px]" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/media/${id}`} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}

export function EmptyState({ icon = "inbox", title, text, action }: { icon?: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Icon name={icon} className="text-[44px] text-outline" />
      <h3 className="text-title-lg">{title}</h3>
      {text && <p className="max-w-md text-body-md text-on-surface-variant">{text}</p>}
      {action}
    </div>
  );
}

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params?: Record<string, string> }) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams({ ...(params ?? {}), page: String(p) });
    return `${basePath}?${q.toString()}`;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Paginasi" className="flex items-center justify-center gap-1.5 pt-6">
      {page > 1 && <Link className="btn-secondary !px-3 !py-1.5" href={href(page - 1)}>Sebelumnya</Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-outline">…</span>}
          <Link href={href(n)} aria-current={n === page ? "page" : undefined} className={cn("flex h-9 w-9 items-center justify-center rounded text-title-md", n === page ? "bg-primary-container text-white" : "bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC]")}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link className="btn-secondary !px-3 !py-1.5" href={href(page + 1)}>Berikutnya</Link>}
    </nav>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, [string, string]> = {
    PUBLISHED: ["badge-success", "Published"], DRAFT: ["badge-warn", "Draft"],
    UNREAD: ["badge-warn", "Belum dibaca"], READ: ["badge-info", "Dibaca"], REPLIED: ["badge-success", "Dibalas"],
    SUPER_ADMIN: ["badge-info", "Super Admin"], ADMIN: ["badge-neutral", "Admin"],
  };
  const [c, l] = map[value] ?? ["badge-neutral", value];
  return <span className={c}>{l}</span>;
}

/** Render konten teks aman: paragraf & subjudul '## ' tanpa HTML mentah (anti-XSS). */
export function SafeText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-body-lg text-on-surface-variant">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? <h2 key={i} className="pt-4 text-headline-lg text-on-surface">{b.slice(3)}</h2> : <p key={i} className="whitespace-pre-line">{b}</p>,
      )}
    </div>
  );
}
