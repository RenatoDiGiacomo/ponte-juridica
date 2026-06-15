interface Opcao<T extends string> {
  label: string;
  valor: T;
}

interface FilterChipsProps<T extends string> {
  opcoes: Opcao<T>[];
  valor: T;
  onChange: (v: T) => void;
  /** 'escuro' para usar sobre fundo navy (hero). */
  variante?: 'claro' | 'escuro';
}

/** Chips de filtro acessíveis (aria-pressed). */
export function FilterChips<T extends string>({ opcoes, valor, onChange, variante = 'claro' }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        const cls = ativo
          ? variante === 'escuro'
            ? 'bg-white text-primary'
            : 'bg-primary text-white'
          : variante === 'escuro'
            ? 'border border-white/20 bg-white/10 text-blue-100'
            : 'border border-slate-200 bg-white text-slate-600';
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(o.valor)}
            className={`min-h-10 rounded-lg px-4 py-2 text-xs font-semibold ${cls}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
