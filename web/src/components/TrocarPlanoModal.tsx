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

const soDigitos = (v: string) => v.replace(/\D/g, '');
const mascaraCartao = (v: string) => soDigitos(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim();
const mascaraValidade = (v: string) => {
  const d = soDigitos(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

/** Modal de cota + troca de plano com checkout SIMULADO (sem cobrança real). */
export function TrocarPlanoModal({ aberto, onFechar, planoAtualNome, consumo, onTrocado }: Props) {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [checkout, setCheckout] = useState<Plano | null>(null);
  const [pagando, setPagando] = useState(false);
  const [cartao, setCartao] = useState({ numero: '', nome: '', validade: '', cvv: '' });
  const [erro, setErro] = useState('');
  const { mostrar } = useToast();

  useEffect(() => {
    if (aberto) planosService.listar().then((r) => setPlanos(r.data as Plano[]));
    else {
      setCheckout(null);
      setCartao({ numero: '', nome: '', validade: '', cvv: '' });
      setErro('');
    }
  }, [aberto]);

  async function pagar() {
    if (!checkout) return;
    setErro('');
    if (soDigitos(cartao.numero).length < 16) return setErro('Número do cartão inválido');
    if (cartao.nome.trim().length < 3) return setErro('Informe o nome impresso no cartão');
    if (soDigitos(cartao.validade).length < 4) return setErro('Validade inválida (MM/AA)');
    if (soDigitos(cartao.cvv).length < 3) return setErro('CVV inválido');
    setPagando(true);
    try {
      // Pagamento simulado — sem gateway real. Efetiva a troca de plano no backend.
      await advogadosService.trocarPlano(checkout.id);
      mostrar(`Pagamento aprovado! Plano ${checkout.nome} ativado.`, 'sucesso');
      onTrocado();
      onFechar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao trocar de plano', 'erro');
    } finally {
      setPagando(false);
    }
  }

  const pct = consumo && consumo.limite ? Math.min(100, (consumo.usadas / consumo.limite) * 100) : 0;

  // ── Passo de pagamento ─────────────────────────────────────────────────────
  if (checkout) {
    return (
      <Modal aberto={aberto} onFechar={onFechar} titulo={`Assinar plano ${checkout.nome}`}>
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">Plano <b>{checkout.nome}</b></p>
            <p className="text-2xl font-extrabold text-primary">R$ {Number(checkout.valorMensal).toFixed(2)}<span className="text-sm font-medium text-slate-400">/mês</span></p>
          </div>

          <p className="flex items-center gap-1 text-xs text-slate-400">🔒 Pagamento simulado — nenhuma cobrança real é feita.</p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Número do cartão</label>
            <input inputMode="numeric" value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: mascaraCartao(e.target.value) })} placeholder="0000 0000 0000 0000" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Nome no cartão</label>
            <input value={cartao.nome} onChange={(e) => setCartao({ ...cartao, nome: e.target.value.toUpperCase() })} placeholder="COMO IMPRESSO" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Validade</label>
              <input inputMode="numeric" value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: mascaraValidade(e.target.value) })} placeholder="MM/AA" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-500">CVV</label>
              <input inputMode="numeric" value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: soDigitos(e.target.value).slice(0, 4) })} placeholder="123" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>

          {erro && <p role="alert" className="text-sm text-erro">⚠️ {erro}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={pagar} disabled={pagando} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
              {pagando ? 'Processando...' : `Pagar R$ ${Number(checkout.valorMensal).toFixed(2)}`}
            </button>
            <button type="button" onClick={() => setCheckout(null)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Voltar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Passo de seleção ───────────────────────────────────────────────────────
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
                onClick={() => { setCheckout(p); setErro(''); }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              >
                Assinar
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
