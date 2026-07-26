import { useCallback, useEffect, useState } from 'react';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';
import { MultiSelect } from '../../components/MultiSelect';
import { TrocarPlanoModal } from '../../components/TrocarPlanoModal';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { mascaraMoeda, moedaParaNumero } from '../../utils/moeda';
import { usePaginatedQuery, type Paginated } from '../../hooks/usePaginatedQuery';

const NAV = [
  { label: 'Painel', to: '/' },
  { label: 'Oportunidades', to: '/oportunidades' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const AREAS = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];
const AREA_OPCOES = AREAS.map((a) => ({ valor: a, label: a }));
const UFS = ['SP', 'RJ', 'MG', 'RS', 'BA', 'PR', 'SC', 'DF', 'PE', 'CE'];
const UF_OPCOES = UFS.map((u) => ({ valor: u, label: u }));
const QTDS = [20, 30, 50, 100];
const INPUT_ESCURO = 'min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-100 placeholder:text-blue-200 [color-scheme:dark]';
const KEY_DESCARTADAS = '@pontejuridica:oportunidades-descartadas';

type Filtros = { areas: string[]; dataDe: string; dataAte: string; estados: string[]; cidade: string };
const FILTROS_VAZIOS: Filtros = { areas: [], dataDe: '', dataAte: '', estados: [], cidade: '' };

type MinhaProposta = { id: number; mensagem: string; valorEstimado: string; status: string; justificativa: string | null };
type ProcessoAberto = {
  id: number; titulo: string; descricao: string; especializacao: string;
  estado?: string | null; cidade?: string | null; dataCriacao: string;
  cliente: { id: number; nome: string }; _count: { propostas: number };
  minhaProposta?: MinhaProposta | null;
};
type Quota = { plano: string; limite: number | null; usadas: number; restantes: number | null };

function lerDescartadas(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_DESCARTADAS) || '[]')); } catch { return new Set(); }
}

export function OportunidadesPage() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [quantidade, setQuantidade] = useState(20);
  const [aplicados, setAplicados] = useState<Filtros>(FILTROS_VAZIOS);
  const [draft, setDraft] = useState<Filtros>(FILTROS_VAZIOS);
  const { mostrar } = useToast();

  // modal de proposta (criar OU editar)
  const [modalProcesso, setModalProcesso] = useState<ProcessoAberto | null>(null);
  const [modalCota, setModalCota] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState('');
  // cancelamento de proposta (dentro do modal de edição)
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [cancelando, setCancelando] = useState(false);
  // oportunidades descartadas (só front, localStorage)
  const [descartadas, setDescartadas] = useState<Set<number>>(lerDescartadas);

  const editando = !!modalProcesso?.minhaProposta;

  const carregarQuota = useCallback(() => {
    processosService.quota().then((r) => setQuota(r.data));
  }, []);
  useEffect(() => { carregarQuota(); }, [carregarQuota]);

  const fetcher = useCallback(
    ({ page, pageSize, signal }: { page: number; pageSize: number; signal: AbortSignal }) =>
      processosService
        .abertos(
          {
            page,
            pageSize,
            ...(aplicados.areas.length && { areas: aplicados.areas.join(',') }),
            ...(aplicados.dataDe && { dataDe: aplicados.dataDe }),
            ...(aplicados.dataAte && { dataAte: aplicados.dataAte }),
            ...(aplicados.estados.length && { estados: aplicados.estados.join(',') }),
            ...(aplicados.cidade && { cidade: aplicados.cidade }),
          },
          signal,
        )
        .then((r) => r.data as Paginated<ProcessoAberto>),
    [aplicados],
  );

  const { data, total, page, setPage, totalPages, loading, recarregar } = usePaginatedQuery<ProcessoAberto>(
    fetcher,
    { pageSize: quantidade, deps: [aplicados, quantidade] },
  );

  const semCota = !!(quota && quota.limite !== null && quota.restantes === 0);
  const visiveis = data.filter((p) => !descartadas.has(p.id));

  function abrirModal(p: ProcessoAberto) {
    setModalProcesso(p);
    setErroModal('');
    setMostrarCancelar(false);
    setJustificativa('');
    if (p.minhaProposta) {
      setMensagem(p.minhaProposta.mensagem);
      // valorEstimado vem como Decimal serializado (ex.: "5500"); converter para centavos antes da máscara.
      setValor(mascaraMoeda(String(Math.round(Number(p.minhaProposta.valorEstimado) * 100))));
    } else {
      setMensagem('');
      setValor('');
    }
  }

  function descartar(id: number) {
    setDescartadas((prev) => {
      const novo = new Set(prev).add(id);
      localStorage.setItem(KEY_DESCARTADAS, JSON.stringify([...novo]));
      return novo;
    });
  }
  function restaurarDescartadas() {
    localStorage.removeItem(KEY_DESCARTADAS);
    setDescartadas(new Set());
  }

  async function submitProposta(e: React.FormEvent) {
    e.preventDefault();
    setErroModal('');
    if (!modalProcesso) return;
    if (mensagem.trim().length < 20) return setErroModal('Mensagem precisa ter ao menos 20 caracteres');
    const valorNum = moedaParaNumero(valor);
    if (!valorNum || valorNum <= 0) return setErroModal('Informe um valor válido');
    setEnviando(true);
    try {
      if (editando && modalProcesso.minhaProposta) {
        await processosService.editarProposta(modalProcesso.minhaProposta.id, { mensagem, valorEstimado: valorNum });
        mostrar('Proposta atualizada', 'sucesso');
      } else {
        await processosService.enviarProposta(modalProcesso.id, { mensagem, valorEstimado: valorNum });
        mostrar('Proposta enviada', 'sucesso');
      }
      setModalProcesso(null);
      recarregar();
      carregarQuota();
    } catch (err: any) {
      setErroModal(err.response?.data?.message ?? 'Falha ao salvar proposta');
    } finally {
      setEnviando(false);
    }
  }

  async function cancelarProposta() {
    if (!modalProcesso?.minhaProposta) return;
    if (justificativa.trim().length < 5) return setErroModal('Informe uma justificativa (mín. 5 caracteres)');
    setCancelando(true);
    setErroModal('');
    try {
      await processosService.cancelarProposta(modalProcesso.minhaProposta.id, justificativa.trim());
      setModalProcesso(null);
      mostrar('Proposta cancelada', 'sucesso');
      recarregar();
      carregarQuota();
    } catch (err: any) {
      setErroModal(err.response?.data?.message ?? 'Falha ao cancelar proposta');
    } finally {
      setCancelando(false);
    }
  }

  const quotaCor = !quota || quota.limite === null
    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : quota.restantes === 0 ? 'bg-red-50 border-red-200 text-red-800'
    : (quota.restantes ?? 0) <= 2 ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-bold text-white">Oportunidades</h1>
          <p className="mt-0.5 text-sm text-blue-200">Casos abertos — por padrão, das suas áreas de atuação</p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <MultiSelect placeholder="Minhas áreas" opcoes={AREA_OPCOES} selecionados={draft.areas} onChange={(areas) => setDraft({ ...draft, areas })} variante="escuro" />
            <label className="flex items-center gap-1 text-xs text-blue-200">
              De
              <input type="date" aria-label="Postado a partir de" value={draft.dataDe} max={draft.dataAte || undefined} onChange={(e) => setDraft({ ...draft, dataDe: e.target.value })} className={INPUT_ESCURO} />
            </label>
            <label className="flex items-center gap-1 text-xs text-blue-200">
              Até
              <input type="date" aria-label="Postado até" value={draft.dataAte} min={draft.dataDe || undefined} onChange={(e) => setDraft({ ...draft, dataAte: e.target.value })} className={INPUT_ESCURO} />
            </label>
            <MultiSelect placeholder="Todos os estados" opcoes={UF_OPCOES} selecionados={draft.estados} onChange={(estados) => setDraft({ ...draft, estados })} variante="escuro" />
            <input aria-label="Cidade" value={draft.cidade} onChange={(e) => setDraft({ ...draft, cidade: e.target.value })} placeholder="Cidade" className={INPUT_ESCURO} />
            <button type="button" onClick={() => setAplicados(draft)} className="min-h-10 rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-primary hover:bg-secondary/90">
              Aplicar
            </button>
            {(aplicados.areas.length || aplicados.dataDe || aplicados.dataAte || aplicados.estados.length || aplicados.cidade) && (
              <button
                type="button"
                onClick={() => { setDraft(FILTROS_VAZIOS); setAplicados(FILTROS_VAZIOS); }}
                className="min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/20"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {quota && (
          <button type="button" onClick={() => setModalCota(true)} className={`mb-6 block w-full rounded-2xl border px-5 py-4 text-left ${quotaCor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Plano {quota.plano}</p>
                <p className="font-bold">
                  {quota.limite === null ? `${quota.usadas} propostas neste mês · ilimitado` : `${quota.usadas} / ${quota.limite} propostas usadas · ${quota.restantes} restantes`}
                </p>
              </div>
              <span className="text-xs font-semibold underline">Gerenciar plano ›</span>
            </div>
          </button>
        )}

        {!loading && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-800">{total}</span> {total === 1 ? 'caso' : 'casos'}
              {descartadas.size > 0 && (
                <button type="button" onClick={restaurarDescartadas} className="ml-2 text-xs font-semibold text-primary hover:underline">
                  ({descartadas.size} descartadas · restaurar)
                </button>
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              Exibir:
              <select aria-label="Quantidade por página" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-600">
                {QTDS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Carregando...</p>
        ) : visiveis.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white">
            <EmptyState icone="📭" titulo="Nenhum caso aberto agora" descricao="Ajuste os filtros (outra área, estado ou período) ou volte mais tarde." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visiveis.map((p) => {
                const jaEnviei = !!p.minhaProposta;
                return (
                  <div key={p.id} className={`flex flex-col rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${jaEnviei ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-800">{p.titulo}</h3>
                      <button type="button" onClick={() => descartar(p.id)} title="Descartar (sumir da lista)" className="shrink-0 text-slate-300 hover:text-slate-500">✕</button>
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{p.especializacao}</span>
                      <span className="text-slate-400">por {p.cliente.nome}</span>
                      {p.cidade && p.estado && <span className="text-slate-400">📍 {p.cidade}/{p.estado}</span>}
                    </div>
                    <p className="mb-4 line-clamp-3 flex-1 text-sm text-slate-600">{p.descricao}</p>
                    {jaEnviei && (
                      <p className="mb-3 text-sm font-semibold text-emerald-700">
                        ✓ Proposta enviada — R$ {Number(p.minhaProposta!.valorEstimado).toFixed(2)}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{p._count.propostas} {p._count.propostas === 1 ? 'proposta' : 'propostas'}</span>
                      {jaEnviei ? (
                        <button type="button" onClick={() => abrirModal(p)} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                          Editar proposta
                        </button>
                      ) : (
                        <button type="button" onClick={() => abrirModal(p)} disabled={semCota} title={semCota ? 'Limite do plano atingido' : 'Enviar proposta'} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                          Enviar proposta
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal aberto={modalProcesso !== null} onFechar={() => setModalProcesso(null)} titulo={`${editando ? 'Editar proposta' : 'Proposta'} — ${modalProcesso?.titulo ?? ''}`}>
        <form onSubmit={submitProposta} className="space-y-4">
          <p className="text-sm text-slate-500">{modalProcesso?.descricao}</p>
          <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Apresente-se e diga como pode ajudar (mín. 20 caracteres)." rows={4} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">R$</span>
            <input type="text" inputMode="numeric" value={valor} onChange={(e) => setValor(mascaraMoeda(e.target.value))} placeholder="0,00" aria-label="Valor estimado (R$)" className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm" />
          </div>
          {erroModal && <p role="alert" className="text-sm text-erro">⚠️ {erroModal}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
              {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Enviar proposta'}
            </button>
            <button type="button" onClick={() => setModalProcesso(null)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Fechar
            </button>
          </div>

          {/* Cancelar a própria proposta (modo edição) — zona de risco destacada */}
          {editando && (
            <div className="mt-1 rounded-xl border border-red-100 bg-red-50/40 p-3">
              {!mostrarCancelar ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-erro">Cancelar proposta</p>
                    <p className="text-[11px] text-slate-500">Some da sua lista e o cliente vê o motivo.</p>
                  </div>
                  <button type="button" onClick={() => { setMostrarCancelar(true); setErroModal(''); }} className="shrink-0 rounded-lg border border-erro/40 bg-white px-3 py-1.5 text-xs font-bold text-erro hover:bg-red-100">
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-erro">Cancelar proposta</p>
                  <p className="text-[11px] text-slate-500">Justificativa (será exibida ao cliente):</p>
                  <textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Ex.: agenda lotada no período." rows={2} maxLength={1000} className="w-full resize-y rounded-lg border border-red-200 bg-white px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button type="button" onClick={cancelarProposta} disabled={cancelando} className="flex-1 rounded-lg bg-erro py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                      {cancelando ? 'Cancelando...' : 'Confirmar cancelamento'}
                    </button>
                    <button type="button" onClick={() => setMostrarCancelar(false)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                      Voltar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>

      <TrocarPlanoModal
        aberto={modalCota}
        onFechar={() => setModalCota(false)}
        planoAtualNome={quota?.plano}
        consumo={quota}
        onTrocado={carregarQuota}
      />
    </div>
  );
}
