interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Paginação numerada. Oculta quando há apenas 1 página (ou nenhuma). */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-5 flex items-center justify-center gap-2" aria-label="Paginação">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
      >
        ‹
      </button>
      <span className="text-sm text-slate-500" aria-current="page">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
        className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
      >
        ›
      </button>
    </nav>
  );
}
