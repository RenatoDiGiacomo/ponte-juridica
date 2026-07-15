import { useEffect, useRef, useState } from 'react';

interface Opcao {
  valor: string;
  label: string;
}

interface MultiSelectProps {
  /** Texto exibido quando nada está selecionado. */
  placeholder: string;
  opcoes: Opcao[];
  selecionados: string[];
  onChange: (valores: string[]) => void;
  /** 'escuro' para uso sobre o hero navy; 'claro' (padrão) sobre fundo branco. */
  variante?: 'claro' | 'escuro';
  className?: string;
}

/**
 * Seletor de múltiplos valores (checkbox dropdown). Fecha ao clicar fora ou Esc.
 * Reutilizado nos filtros de "Minhas áreas" (cliente) e estados (advogado).
 */
export function MultiSelect({ placeholder, opcoes, selecionados, onChange, variante = 'claro', className = '' }: MultiSelectProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  function alternar(valor: string) {
    onChange(selecionados.includes(valor) ? selecionados.filter((v) => v !== valor) : [...selecionados, valor]);
  }

  const escuro = variante === 'escuro';
  const botaoCls = escuro
    ? 'border-white/20 bg-white/10 text-blue-100'
    : 'border-slate-200 bg-white text-slate-600';

  const resumo =
    selecionados.length === 0
      ? placeholder
      : selecionados.length === 1
        ? opcoes.find((o) => o.valor === selecionados[0])?.label ?? placeholder
        : `${selecionados.length} selecionados`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${botaoCls}`}
      >
        <span>{resumo}</span>
        <span className="text-xs opacity-70">▾</span>
      </button>

      {aberto && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-56 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
        >
          {opcoes.map((o) => {
            const marcado = selecionados.includes(o.valor);
            return (
              <button
                key={o.valor}
                type="button"
                role="option"
                aria-selected={marcado}
                onClick={() => alternar(o.valor)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                    marcado ? 'border-primary bg-primary text-white' : 'border-slate-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
                {o.label}
              </button>
            );
          })}
          {selecionados.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-md px-2 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50"
            >
              Limpar seleção
            </button>
          )}
        </div>
      )}
    </div>
  );
}
