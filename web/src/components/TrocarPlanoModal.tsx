import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { advogadosService, planosService } from '../services/api';
import { useToast } from './Toast';

type Plano = { id: number; nome: string; valorMensal: string; valorAnual: string };
type Consumo = { plano: string; limite: number | null; usadas: number; restantes: number | null };

interface Props {
  aberto: boolean;
  onFechar: () => void;
  planoAtualNome?: string;
  consumo?: Consumo | null;
  onTrocado: () => void;
}

/** Modal de cota + troca de plano (A2/A6). Mostra consumo e lista planos para upgrade. */
export function TrocarPlanoModal({ aberto, onFechar, planoAtualNome, consumo, onTrocado }: Props) {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [trocando, setTrocando] = useState<number | null>(null);
  const { mostrar } = useToast();

  useEffect(() => {
    if (aberto) planosService.listar().then((r) => setPlanos(r.data as Plano[]));
  }, [aberto]);

  async function trocar(planoId: number) {
    setTrocando(planoId);
    try {
      await advogadosService.trocarPlano(planoId);
      mostrar('Plano alterado', 'sucesso');
      onTrocado();
      onFechar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao trocar de plano', 'erro');
    } finally {
      setTrocando(null);
    }
  }

  const pct = consumo && consumo.limite ? Math.min(100, (consumo.usadas / consumo.limite) * 100) : 0;

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Cota e plano">
      {consumo && (
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Plano <b>{consumo.plano}</b> ·{' '}
            {consumo.limite === null ? `${consumo.usadas} propostas (ilimitado)` : `${consumo.usadas} / ${consumo.limite} usadas · ${consumo.restantes} restantes`}
          </p>
          {consumo.limite !== null && (
            <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
              <div className="h-full bg-secondary" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Planos disponíveis</p>
      <div className="space-y-2">
        {planos.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
            <div>
              <p className="font-bold text-slate-800">{p.nome}</p>
              <p className="text-xs text-slate-500">R$ {Number(p.valorMensal).toFixed(2)}/mês</p>
            </div>
            {p.nome === planoAtualNome ? (
              <span className="text-xs font-semibold text-emerald-600">Plano atual</span>
            ) : (
              <button
                type="button"
                onClick={() => trocar(p.id)}
                disabled={trocando !== null}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {trocando === p.id ? 'Trocando...' : 'Selecionar'}
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
