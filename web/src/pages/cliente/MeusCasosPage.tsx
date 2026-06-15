import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Vinculados', to: '/minhas-conexoes' },
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
  advogado: { id: number; nome: string; especializacao: string; oab: string };
};

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
};

export function MeusCasosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [propostaConfirmar, setPropostaConfirmar] = useState<Proposta | null>(null);
  const [aceitando, setAceitando] = useState(false);
  const [encerrarId, setEncerrarId] = useState<number | null>(null);
  const [encerrando, setEncerrando] = useState(false);
  const { mostrar } = useToast();

  const carregar = useCallback(async () => {
    const { data } = await processosService.meus();
    setProcessos(data);
  }, []);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const filtrados = useMemo(
    () =>
      processos.filter(
        (p) => busca === '' || p.titulo.toLowerCase().includes(busca.toLowerCase()),
      ),
    [processos, busca],
  );

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

                  <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Propostas recebidas ({selecionado.propostas.length})
                  </p>
                  {selecionado.propostas.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                      Nenhuma proposta ainda neste caso.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selecionado.propostas.map((pr) => (
                        <div key={pr.id} className="rounded-xl border border-slate-100 p-4">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-800">{pr.advogado.nome}</p>
                              <p className="text-xs text-slate-400">
                                OAB {pr.advogado.oab} · {pr.advogado.especializacao}
                              </p>
                            </div>
                            <p className="shrink-0 text-lg font-bold text-secondary">
                              R$ {Number(pr.valorEstimado).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">{pr.mensagem}</p>

                          {pr.status === 'pendente' && selecionado.status === 'aberto' && (
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
                          {pr.status === 'aceita' && (
                            <p className="mt-2 text-sm font-bold text-emerald-700">✓ Proposta aceita</p>
                          )}
                          {pr.status === 'recusada' && <p className="mt-2 text-sm text-slate-400">Recusada</p>}
                        </div>
                      ))}
                    </div>
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
