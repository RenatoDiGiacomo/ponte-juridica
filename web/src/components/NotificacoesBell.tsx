import { useCallback, useEffect, useRef, useState } from 'react';
import { notificacoesService } from '../services/api';

type Notificacao = { id: number; tipo: string; titulo: string; mensagem: string; lida: boolean; dataCriacao: string };

const ICONE: Record<string, string> = {
  nova_proposta: '📩',
  proposta_aceita: '🎉',
  novo_relatorio: '📝',
  nova_avaliacao: '⭐',
};

/** Sino de notificações com contador de não lidas + dropdown. Poll leve a cada 30s. */
export function NotificacoesBell() {
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const carregarContador = useCallback(() => {
    notificacoesService.naoLidas().then((r) => setNaoLidas(r.data.total)).catch(() => {});
  }, []);

  useEffect(() => {
    carregarContador();
    const t = setInterval(carregarContador, 30_000);
    return () => clearInterval(t);
  }, [carregarContador]);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  async function abrir() {
    const novo = !aberto;
    setAberto(novo);
    if (novo) {
      const { data } = await notificacoesService.listar();
      setLista(data);
      if (data.some((n) => !n.lida)) {
        await notificacoesService.marcarTodas();
        setNaoLidas(0);
        setLista((prev) => prev.map((n) => ({ ...n, lida: true })));
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={abrir}
        aria-label="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-slate-100"
      >
        🔔
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-800">Notificações</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {lista.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Nenhuma notificação ainda.</p>
            ) : (
              lista.map((n) => (
                <div key={n.id} className="flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0">
                  <span className="text-lg">{ICONE[n.tipo] ?? '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{n.titulo}</p>
                    <p className="text-xs text-slate-500">{n.mensagem}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{new Date(n.dataCriacao).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
