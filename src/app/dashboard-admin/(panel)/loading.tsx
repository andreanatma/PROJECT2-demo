export default function Loading() {
  return (
    <div role="status" aria-label="Memuat" className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-[#E2E8F0]" />
      <div className="h-64 animate-pulse rounded-lg bg-[#E2E8F0]/70" />
    </div>
  );
}
