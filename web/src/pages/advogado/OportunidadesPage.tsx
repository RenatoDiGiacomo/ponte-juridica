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
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const AREAS = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];
const AREA_OPCOES = AREAS.map((a) => ({ valor: a, label: a }));
const UFS = ['SP', 'RJ', 'MG', 'RS', 'BA', 'PR', 'SC', 'DF', 'PE', 'CE'];
const UF_OPCOES = UFS.map((u) => ({ valor: u, label: u }));
const QTDS = [20, 30, 50, 100];
// Controles sobre o hero navy (mesmo padrão visual da tela de Clientes / Meus Casos do cliente)
const INPUT_ESCURO = 'min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-100 placeholder:text-blue-200 [color-scheme:dark]';

type Filtros = { areas: string[]; dataDe: string; dataAte: string; estados: string[]; cidade: string };
const FILTROS_VAZIOS: Filtros = { areas: [], dataDe: '', dataAte: '', estados: [], cidade: '' };

type ProcessoAberto = {
  id: number; titulo: string; descricao: string; especializacao: string;
  estado?: string | null; cidade?: string | null; dataCriacao: string;
  cliente: { id: number; nome: string }; _count: { propostas: number };
};
type Quota = { plano: string; limite: number | null; usadas: number; restantes: number | null };

export function OportunidadesPage() {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [quantidade, setQuantidade] = useState(20);
  // filtros aplicados (deps) vs. rascunho (UI) — advogado usa botão "Aplicar"
  const [aplicados, setAplicados] = useState<Filtros>(FILTROS_VAZIOS);
  const [draft, setDraft] = useState<Filtros>(FILTROS_VAZIOS);
  const { mostrar } = useToast();

  // modal de proposta
  const [modalProcesso, setModalProcesso] = useState<ProcessoAberto | null>(null);
  const [modalCota, setModalCota] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState('');

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

  function abrirModal(p: ProcessoAberto) {
    setModalProcesso(p); setMensagem(''); setValor(''); setErroModal('');
  }

  async function enviarProposta(e: React.FormEvent) {
    e.preventDefault();
    setErroModal('');
    if (!modalProcesso) return;
    if (mensagem.trim().length < 20) return setErroModal('Mensagem precisa ter ao menos 20 caracteres');
    const valorNum = moedaParaNumero(valor);
    if (!valorNum || valorNum <= 0) return setErroModal('Informe um valor válido');
    setEnviando(true);
    try {
      await processosService.enviarProposta(modalProcesso.id, { mensagem, valorEstimado: valorNum });
      setModalProcesso(null);
      mostrar('Proposta enviada', 'sucesso');
      recarregar();
      carregarQuota();
    } catch (err: any) {
      setErroModal(err.response?.data?.message ?? 'Falha ao enviar proposta');
    } finally {
      setEnviando(false);
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
        {/* Filtros no hero (mesmo padrão visual da tela de Clientes) */}
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
            <div className="flex items-center gap-2 text-xs text-blue-200">
              Exibir:
              <select aria-label="Quantidade por página" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className={INPUT_ESCURO}>
                {QTDS.map((q) => <option key={q} value={q} className="text-slate-800">{q}</option>)}
              </select>
            </div>
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

        {!loading && <p className="mb-4 text-sm text-slate-500"><span className="font-bold text-slate-800">{total}</span> {total === 1 ? 'caso' : 'casos'}</p>}

        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Carregando...</p>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white">
            <EmptyState icone="📭" titulo="Nenhum caso aberto agora" descricao="Ajuste os filtros (outra área, estado ou período) ou volte mais tarde." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.map((p) => (
                <div key={p.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <h3 className="mb-2 font-bold text-slate-800">{p.titulo}</h3>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{p.especializacao}</span>
                    <span className="text-slate-400">por {p.cliente.nome}</span>
                    {p.cidade && p.estado && <span className="text-slate-400">📍 {p.cidade}/{p.estado}</span>}
                  </div>
                  <p className="mb-4 line-clamp-3 flex-1 text-sm text-slate-600">{p.descricao}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{p._count.propostas} {p._count.propostas === 1 ? 'proposta' : 'propostas'}</span>
                    <button type="button" onClick={() => abrirModal(p)} disabled={semCota} title={semCota ? 'Limite do plano atingido' : 'Enviar proposta'} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                      Enviar proposta
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal aberto={modalProcesso !== null} onFechar={() => setModalProcesso(null)} titulo={`Proposta — ${modalProcesso?.titulo ?? ''}`}>
        <form onSubmit={enviarProposta} className="space-y-4">
          <p className="text-sm text-slate-500">{modalProcesso?.descricao}</p>
          <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Apresente-se e diga como pode ajudar (mín. 20 caracteres)." rows={4} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">R$</span>
            <input
              type="text"
              inputMode="numeric"
              value={valor}
              onChange={(e) => setValor(mascaraMoeda(e.target.value))}
              placeholder="0,00"
              aria-label="Valor estimado (R$)"
              className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm"
            />
          </div>
          {erroModal && <p role="alert" className="text-sm text-erro">⚠️ {erroModal}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={enviando} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
              {enviando ? 'Enviando...' : 'Enviar proposta'}
            </button>
            <button type="button" onClick={() => setModalProcesso(null)} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
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
