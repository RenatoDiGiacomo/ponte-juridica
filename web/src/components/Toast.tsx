import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastTipo = 'sucesso' | 'erro' | 'info';

interface ToastItem {
  id: number;
  tipo: ToastTipo;
  mensagem: string;
}

interface ToastCtx {
  mostrar: (mensagem: string, tipo?: ToastTipo) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast deve estar dentro de <ToastProvider>');
  return ctx;
}

const CORES: Record<ToastTipo, string> = {
  sucesso: 'bg-sucesso',
  erro: 'bg-erro',
  info: 'bg-primary',
};

let proximoId = 0;

/** Toasts transitórios (aria-live) — substituem os avisos nativos do navegador. Auto-dismiss + fechar manual. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([]);

  const remover = useCallback((id: number) => {
    setItens((xs) => xs.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (mensagem: string, tipo: ToastTipo = 'info') => {
      const id = ++proximoId;
      setItens((xs) => [...xs, { id, tipo, mensagem }]);
      setTimeout(() => remover(id), 4000);
    },
    [remover],
  );

  return (
    <Ctx.Provider value={{ mostrar }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {itens.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${CORES[t.tipo]}`}
          >
            <span>{t.mensagem}</span>
            <button
              type="button"
              onClick={() => remover(t.id)}
              aria-label="Fechar aviso"
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
