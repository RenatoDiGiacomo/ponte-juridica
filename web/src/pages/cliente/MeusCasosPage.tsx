import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { processosService, avaliacoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { StatusBadge, type CasoStatus } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { FilterChips } from '../../components/FilterChips';
import { MultiSelect } from '../../components/MultiSelect';

const AREAS = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];
const AREA_OPCOES = AREAS.map((a) => ({ valor: a, label: a }));
const STATUS_OPCOES: { label: string; valor: CasoStatus | 'todos' }[] = [
  { label: 'Todos', valor: 'todos' },
  { label: 'Aberto', valor: 'aberto' },
  { label: 'Em atendimento', valor: 'em_atendimento' },
  { label: 'Encerrado', valor: 'encerrado' },
];

function menorValor(p: { propostas: { valorEstimado: string }[] }): number {
  if (!p.propostas.length) return Number.POSITIVE_INFINITY;
  return Math.min(...p.propostas.map((pr) => Number(pr.valorEstimado)));
}

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Meus Contatos', to: '/minhas-conexoes' },
  { label: 'Minha Conta', to: '/perfil' },
];

const ESP_ICONS: Record<string, string> = {
  Criminal: '🔒', Trabalhista: '🏭', Família: '👨‍👩‍👧',
  Cível: '📋', Tributário: '💰', Previdenciário: '🛡️',
};

type Proposta = {
  id: number;
  mensagem: string;
  valorEstimado: string;
  status: 'pendente' | 'aceita' | 'recusada';
  advogado: { id: number; nome: string; oab: string };
};

type Avaliacao = { id: number; nota: number; comentario: string | null };
type Processo = {
  id: number;
  titulo: string;
  descricao: string;
  especializacao: string;
  status: 'aberto' | 'em_atendimento' | 'encerrado';
  estado?: string | null;
  cidade?: string | null;
  dataCriacao: string;
  propostas: Proposta[];
  avaliacoes?: Avaliacao[];
};

export function MeusCasosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<CasoStatus | 'todos'>('aberto');
  const [areasFiltro, setAreasFiltro] = useState<string[]>([]);
  const [estadosFiltro, setEstadosFiltro] = useState<string[]>([]);
  const [ordemValor, setOrdemValor] = useState<'' | 'asc' | 'desc'>('');
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [propostaConfirmar, setPropostaConfirmar] = useState<Proposta | null>(null);
  const [aceitando, setAceitando] = useState(false);
  const [encerrarId, setEncerrarId] = useState<number | null>(null);
  const [encerrando, setEncerrando] = useState(false);
  const [avaliarCaso, setAvaliarCaso] = useState<Processo | null>(null);
  const [notaAval, setNotaAval] = useState(5);
  const [comentarioAval, setComentarioAval] = useState('');
  const [enviandoAval, setEnviandoAval] = useState(false);
  const [mostrarRecusadas, setMostrarRecusadas] = useState(false);
  const { mostrar } = useToast();

  const carregar = useCallback(async () => {
    const { data } = await processosService.meus();
    setProcessos(data);
  }, []);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const estadosDisponiveis = useMemo(
    () => [...new Set(processos.map((p) => p.estado).filter((e): e is string => !!e))].sort(),
    [processos],
  );

  const filtrados = useMemo(() => {
    let lista = processos.filter(
      (p) =>
        (busca === '' || p.titulo.toLowerCase().includes(busca.toLowerCase())) &&
        (statusFiltro === 'todos' || p.status === statusFiltro) &&
        (areasFiltro.length === 0 || areasFiltro.includes(p.especializacao)) &&
        (estadosFiltro.length === 0 || (p.estado != null && estadosFiltro.includes(p.estado))),
    );
    if (ordemValor) {
      lista = [...lista].sort((a, b) =>
        ordemValor === 'asc' ? menorValor(a) - menorValor(b) : menorValor(b) - menorValor(a),
      );
    }
    return lista;
  }, [processos, busca, statusFiltro, areasFiltro, estadosFiltro, ordemValor]);

  // Pré-seleciona o 1º caso da lista filtrada em tela larga (≥1024px); preserva seleção válida.
  useEffect(() => {
    if (loading) return;
    const valido = selecionadoId !== null && filtrados.some((p) => p.id === selecionadoId);
    if (!valido) {
      const larga = window.matchMedia('(min-width: 1024px)').matches;
      setSelecionadoId(larga && filtrados.length ? filtrados[0].id : null);
    }
  }, [filtrados, loading, selecionadoId]);

  const selecionado = filtrados.find((p) => p.id === selecionadoId) ?? null;

  // Grupo de recusadas volta a fechar ao trocar de caso.
  useEffect(() => setMostrarRecusadas(false), [selecionadoId]);

  async function confirmarAceite() {
    if (!propostaConfirmar) return;
    setAceitando(true);
    try {
      await processosService.aceitarProposta(propostaConfirmar.id);
      setPropostaConfirmar(null);
      mostrar('Proposta aceita', 'sucesso');
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao aceitar', 'erro');
    } finally {
      setAceitando(false);
    }
  }

  async function recusarProposta(p: Proposta) {
    try {
      await processosService.recusarProposta(p.id);
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao recusar', 'erro');
    }
  }

  function abrirAvaliacao(p: Processo) {
    setAvaliarCaso(p);
    setNotaAval(5);
    setComentarioAval('');
  }

  async function enviarAvaliacao() {
    if (!avaliarCaso) return;
    setEnviandoAval(true);
    try {
      await avaliacoesService.criar({
        processoId: avaliarCaso.id,
        nota: notaAval,
        comentario: comentarioAval.trim() || undefined,
      });
      setAvaliarCaso(null);
      mostrar('Avaliação enviada. Obrigado!', 'sucesso');
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao avaliar', 'erro');
    } finally {
      setEnviandoAval(false);
    }
  }

  async function confirmarEncerramento() {
    if (encerrarId === null) return;
    setEncerrando(true);
    try {
      await processosService.encerrar(encerrarId);
      setEncerrarId(null);
      mostrar('Caso encerrado', 'sucesso');
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao encerrar', 'erro');
    } finally {
      setEncerrando(false);
    }
  }

  // Card de uma proposta, com destaque por status (aceita=verde, recusada=apagada/vermelha).
  const cardProposta = (pr: Proposta) => {
    const cor =
      pr.status === 'aceita'
        ? 'border-emerald-200 bg-emerald-50'
        : pr.status === 'recusada'
          ? 'border-red-100 bg-red-50/50 opacity-70'
          : 'border-slate-100';
    return (
      <div key={pr.id} className={`rounded-xl border p-4 ${cor}`}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-slate-800">{pr.advogado.nome}</p>
            <p className="text-xs text-slate-400">OAB {pr.advogado.oab}</p>
          </div>
          <p className="shrink-0 text-lg font-bold text-secondary">R$ {Number(pr.valorEstimado).toFixed(2)}</p>
        </div>
        <p className="text-sm text-slate-600">{pr.mensagem}</p>

        {pr.status === 'pendente' && selecionado?.status === 'aberto' && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setPropostaConfirmar(pr)}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              ✓ Aceitar
            </button>
            <button
              type="button"
              onClick={() => recusarProposta(pr)}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Recusar
            </button>
          </div>
        )}
        {pr.status === 'aceita' && <p className="mt-2 text-sm font-bold text-emerald-700">✓ Proposta aceita</p>}
        {pr.status === 'recusada' && <p className="mt-2 text-sm font-semibold text-erro">✕ Recusada</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      {/* Hero — título reduzido (C2) */}
      <div className="bg-primary">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-xl font-bold text-white">Meus Casos</h1>
            <p className="mt-0.5 text-sm text-blue-200">
              {loading ? '...' : `${processos.length} ${processos.length === 1 ? 'caso publicado' : 'casos publicados'}`}
            </p>
          </div>
          <Link
            to="/casos/novo"
            className="rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-primary shadow-lg transition-all hover:bg-secondary/90 active:scale-[0.98]"
          >
            + Publicar caso
          </Link>
        </div>
        {processos.length > 0 && (
          <div className="mx-auto max-w-6xl px-6 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <FilterChips opcoes={STATUS_OPCOES} valor={statusFiltro} onChange={setStatusFiltro} variante="escuro" />
              <MultiSelect placeholder="Minhas áreas" opcoes={AREA_OPCOES} selecionados={areasFiltro} onChange={setAreasFiltro} variante="escuro" />
              {estadosDisponiveis.length > 1 && (
                <MultiSelect
                  placeholder="Todos os estados"
                  opcoes={estadosDisponiveis.map((e) => ({ valor: e, label: e }))}
                  selecionados={estadosFiltro}
                  onChange={setEstadosFiltro}
                  variante="escuro"
                />
              )}
              <select
                aria-label="Ordenar por valor"
                value={ordemValor}
                onChange={(e) => setOrdemValor(e.target.value as '' | 'asc' | 'desc')}
                className="min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-100"
              >
                <option value="" className="text-slate-800">Ordenar: padrão</option>
                <option value="asc" className="text-slate-800">Valor ↑ (menor)</option>
                <option value="desc" className="text-slate-800">Valor ↓ (maior)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Master-detail */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        ) : processos.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white">
            <EmptyState
              icone="📝"
              titulo="Você ainda não publicou nenhum caso"
              descricao="Publique seu caso e advogados especializados vão te enviar propostas."
              acao={
                <Link to="/casos/novo" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90">
                  + Publicar primeiro caso
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* Sidebar — lista de casos */}
            <aside className="overflow-hidden rounded-2xl bg-[#16314e] p-4">
              <p className="mb-2 text-[10px] font-bold tracking-widest text-[#7e9bbd]">MEUS CASOS</p>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="🔍 Buscar caso..."
                aria-label="Buscar caso"
                className="mb-3 w-full rounded-lg border border-white/10 bg-[#0f273f] px-3 py-2 text-sm text-white placeholder:text-[#7e9bbd]"
              />
              <ul className="space-y-1.5">
                {filtrados.map((p) => {
                  const ativo = p.id === selecionadoId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-current={ativo ? 'true' : undefined}
                        onClick={() => setSelecionadoId(p.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          ativo ? 'border-secondary bg-[#fdf6e3]' : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <p className={`text-sm font-bold leading-tight ${ativo ? 'text-primary' : 'text-slate-100'}`}>
                          {p.titulo}
                        </p>
                        <p className={`mt-1.5 text-[11px] ${ativo ? 'text-[#94795b]' : 'text-[#7e9bbd]'}`}>
                          {p.propostas.length === 0
                            ? 'Sem propostas'
                            : `${p.propostas.length} ${p.propostas.length === 1 ? 'proposta' : 'propostas'}`}
                        </p>
                      </button>
                    </li>
                  );
                })}
                {filtrados.length === 0 && (
                  <li className="py-6 text-center text-xs text-[#7e9bbd]">Nenhum caso encontrado.</li>
                )}
              </ul>
            </aside>

            {/* Detalhe — caso selecionado + propostas */}
            <section className="rounded-2xl border border-slate-100 bg-white">
              {!selecionado ? (
                <EmptyState icone="👈" titulo="Selecione um caso" descricao="Escolha um caso na lista para ver as propostas recebidas." />
              ) : (
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="flex-1 text-lg font-bold text-slate-800">{selecionado.titulo}</h2>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={selecionado.status} />
                      {selecionado.status !== 'encerrado' && (
                        <button
                          type="button"
                          onClick={() => setEncerrarId(selecionado.id)}
                          className="text-xs font-semibold text-erro hover:underline"
                        >
                          Encerrar caso
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="mb-3 inline-block rounded-full bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary">
                    {ESP_ICONS[selecionado.especializacao] ?? '⚖️'} {selecionado.especializacao}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-600">{selecionado.descricao}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    Publicado em {new Date(selecionado.dataCriacao).toLocaleDateString('pt-BR')}
                    {selecionado.cidade && selecionado.estado ? ` · 📍 ${selecionado.cidade}/${selecionado.estado}` : ''}
                  </p>

                  {/* Avaliação — só faz sentido quando o caso encerrado teve advogado responsável (proposta aceita) */}
                  {selecionado.status === 'encerrado' && (
                    selecionado.avaliacoes && selecionado.avaliacoes.length > 0 ? (
                      <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">
                          ✓ Você avaliou este atendimento: {'★'.repeat(selecionado.avaliacoes[0].nota)}{'☆'.repeat(5 - selecionado.avaliacoes[0].nota)}
                        </p>
                        {selecionado.avaliacoes[0].comentario && (
                          <p className="mt-1 text-xs text-emerald-700">"{selecionado.avaliacoes[0].comentario}"</p>
                        )}
                      </div>
                    ) : selecionado.propostas.some((p) => p.status === 'aceita') ? (
                      <button
                        type="button"
                        onClick={() => abrirAvaliacao(selecionado)}
                        className="mt-4 w-full rounded-xl border border-secondary bg-secondary/10 py-2.5 text-sm font-bold text-primary hover:bg-secondary/20"
                      >
                        ⭐ Avaliar o advogado deste caso
                      </button>
                    ) : null
                  )}

                  <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Propostas recebidas ({selecionado.propostas.length})
                  </p>
                  {selecionado.propostas.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                      Nenhuma proposta ainda neste caso.
                    </p>
                  ) : selecionado.status === 'aberto' ? (
                    <div className="space-y-3">{selecionado.propostas.map(cardProposta)}</div>
                  ) : (
                    // Em atendimento / encerrado: aceita primeiro; demais num grupo colapsável (fechado).
                    (() => {
                      const aceitas = selecionado.propostas.filter((p) => p.status === 'aceita');
                      const outras = selecionado.propostas.filter((p) => p.status !== 'aceita');
                      return (
                        <div className="space-y-3">
                          {aceitas.map(cardProposta)}
                          {outras.length > 0 && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setMostrarRecusadas((v) => !v)}
                                aria-expanded={mostrarRecusadas}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                <span>Outras propostas ({outras.length})</span>
                                <span className="text-xs">{mostrarRecusadas ? '▾ ocultar' : '▸ mostrar'}</span>
                              </button>
                              {mostrarRecusadas && <div className="mt-3 space-y-3">{outras.map(cardProposta)}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <ConfirmModal
        aberto={propostaConfirmar !== null}
        titulo="Aceitar proposta"
        mensagem={
          propostaConfirmar
            ? `Aceitar a proposta de ${propostaConfirmar.advogado.nome} por R$ ${Number(propostaConfirmar.valorEstimado).toFixed(2)}? O caso passará para "Em atendimento".`
            : ''
        }
        textoConfirmar="Aceitar"
        carregando={aceitando}
        onConfirmar={confirmarAceite}
        onCancelar={() => setPropostaConfirmar(null)}
      />

      <Modal aberto={avaliarCaso !== null} onFechar={() => setAvaliarCaso(null)} titulo="Avaliar advogado">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Como foi o atendimento no caso "{avaliarCaso?.titulo}"?</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNotaAval(n)}
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                className={`text-3xl transition-transform hover:scale-110 ${n <= notaAval ? 'text-secondary' : 'text-slate-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comentarioAval}
            onChange={(e) => setComentarioAval(e.target.value)}
            placeholder="Deixe um comentário (opcional)"
            rows={3}
            maxLength={1000}
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={enviarAvaliacao}
              disabled={enviandoAval}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {enviandoAval ? 'Enviando...' : 'Enviar avaliação'}
            </button>
            <button
              type="button"
              onClick={() => setAvaliarCaso(null)}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        aberto={encerrarId !== null}
        titulo="Encerrar caso"
        mensagem="Tem certeza que deseja encerrar este caso? Esta ação o move para Encerrado e não pode ser desfeita."
        textoConfirmar="Encerrar"
        variante="reforcado"
        carregando={encerrando}
        onConfirmar={confirmarEncerramento}
        onCancelar={() => setEncerrarId(null)}
      />
    </div>
  );
}
