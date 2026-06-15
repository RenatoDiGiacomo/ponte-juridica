/** Placeholder de carregamento (pulse) — usado no detalhe do master-detail (C2). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden />;
}
