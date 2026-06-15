export type CasoStatus = 'aberto' | 'em_atendimento' | 'encerrado';

const MAP: Record<CasoStatus, { label: string; cls: string }> = {
  aberto: { label: 'Aberto', cls: 'bg-blue-50 text-status-aberto ring-blue-200' },
  em_atendimento: { label: 'Em atendimento', cls: 'bg-emerald-50 text-status-atendimento ring-emerald-200' },
  encerrado: { label: 'Encerrado', cls: 'bg-slate-100 text-status-encerrado ring-slate-200' },
};

/** Selo de status do caso — cor + texto (nunca só cor, para daltônicos). */
export function StatusBadge({ status }: { status: CasoStatus }) {
  const s = MAP[status] ?? MAP.aberto;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${s.cls}`}>
      <span aria-hidden className="text-[8px]">●</span>
      {s.label}
    </span>
  );
}
