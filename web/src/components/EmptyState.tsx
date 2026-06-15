import { type ReactNode } from 'react';

interface EmptyStateProps {
  icone?: string;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

/** Estado vazio orientador: ícone + frase humana + (opcional) CTA do próximo passo. */
export function EmptyState({ icone = '📭', titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 text-5xl">{icone}</div>
      <p className="text-lg font-semibold text-slate-700">{titulo}</p>
      {descricao && <p className="mt-2 max-w-sm text-sm text-slate-400">{descricao}</p>}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}
