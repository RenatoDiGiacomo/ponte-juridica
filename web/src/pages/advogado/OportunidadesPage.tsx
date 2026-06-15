import { useCallback, useEffect, useState } from 'react';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { usePaginatedQuery, type Paginated } from '../../hooks/usePaginatedQuery';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const AREAS = ['', 'Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];
const UFS = ['', 'SP', 'RJ', 'MG', 'RS', 'BA', 'PR', 'SC', 'DF'];
const TEMPOS = [{ v: '', l: 'Qualquer data' }, { v: '7', l: 'Últimos 7 dias' }, { v: '30', l: 'Últimos 30 dias' }, { v: '90', l: 'Últimos 90 dias' }];
const QTDS = [20, 30, 50, 100];
const SELECT = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600';

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
  const [aplicados, setAplicados] = useState({ area: '', postadoDias: '', estado: '', cidade: '' });
  const [draft, setDraft] = useState({ area: '', postadoDias: '', estado: '', cidade: '' });
  const { mostrar } = useToast();

  // modal de proposta
  const [modalProcesso, setModalProcesso] = useState<ProcessoAberto | null>(null);
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
            ...(aplicados.area && { area: aplicados.area }),
            ...(aplicados.postadoDias && { postadoDias: Number(aplicados.postadoDias) }),
            ...(aplicados.estado && { estado: aplicados.estado }),
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
    const valorNum = Number(valor.replace(',', '.'));
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
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {quota && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 ${quotaCor}`}>
            <p className="text-xs font-bold uppercase tracking-wider">Plano {quota.plano}</p>
            <p className="font-bold">
              {quota.limite === null ? `${quota.usadas} propostas neste mês · ilimitado` : `${quota.usadas} / ${quota.limite} propostas usadas · ${quota.restantes} restantes`}
            </p>
          </div>
        )}

        {/* Filtros compostos com Aplicar (advogado) */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <select aria-label="Área" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} className={SELECT}>
            {AREAS.map((a) => <option key={a} value={a}>{a === '' ? 'Minhas áreas' : a}</option>)}
          </select>
          <select aria-label="Tempo de postagem" value={draft.postadoDias} onChange={(e) => setDraft({ ...draft, postadoDias: e.target.value })} className={SELECT}>
            {TEMPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <select aria-label="Estado" value={draft.estado} onChange={(e) => setDraft({ ...draft, estado: e.target.value })} className={SELECT}>
            {UFS.map((u) => <option key={u} value={u}>{u === '' ? 'Todos os estados' : u}</option>)}
          </select>
          <input aria-label="Cidade" value={draft.cidade} onChange={(e) => setDraft({ ...draft, cidade: e.target.value })} placeholder="Cidade" className={SELECT} />
          <button type="button" onClick={() => setAplicados(draft)} className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
            Aplicar
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            Exibir:
            <select aria-label="Quantidade por página" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} className={SELECT}>
              {QTDS.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        </div>

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
          <input type="text" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor estimado (R$)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
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
    </div>
  );
}
