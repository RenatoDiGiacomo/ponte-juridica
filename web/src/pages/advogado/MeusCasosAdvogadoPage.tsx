import { useCallback, useEffect, useMemo, useState } from 'react';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { StatusBadge, type CasoStatus } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const FILTROS: { label: string; status: CasoStatus | 'todos' }[] = [
  { label: 'Todos', status: 'todos' },
  { label: 'Aberto', status: 'aberto' },
  { label: 'Em atendimento', status: 'em_atendimento' },
  { label: 'Encerrado', status: 'encerrado' },
];

type Relatorio = { id: number; texto: string; dataCriacao: string; advogado: { nome: string } };
type MinhaProposta = { id: number; status: string; valorEstimado: string };
type Caso = {
  id: number;
  titulo: string;
  descricao: string;
  status: CasoStatus;
  estado?: string | null;
  cidade?: string | null;
  dataCriacao: string;
  cliente: { id: number; nome: string };
  propostas: MinhaProposta[];
  relatorios: Relatorio[];
};

export function MeusCasosAdvogadoPage() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<CasoStatus | 'todos'>('todos');
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [encerrarId, setEncerrarId] = useState<number | null>(null);
  const [encerrando, setEncerrando] = useState(false);
  const { mostrar } = useToast();

  const carregar = useCallback(async () => {
    const { data } = await processosService.meusCasosAdvogado();
    setCasos(data);
  }, []);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const filtrados = useMemo(
    () => (filtro === 'todos' ? casos : casos.filter((c) => c.status === filtro)),
    [casos, filtro],
  );

  useEffect(() => {
    if (loading) return;
    const valido = selecionadoId !== null && filtrados.some((c) => c.id === selecionadoId);
    if (!valido) {
      const larga = window.matchMedia('(min-width: 1024px)').matches;
      setSelecionadoId(larga && filtrados.length ? filtrados[0].id : null);
    }
  }, [filtrados, loading, selecionadoId]);

  const sel = filtrados.find((c) => c.id === selecionadoId) ?? null;
  const minhaProposta = sel?.propostas[0];
  const souResponsavel = minhaProposta?.status === 'aceita';

  async function registrarRelatorio() {
    if (!sel || texto.trim().length < 3) return;
    setSalvando(true);
    try {
      await processosService.adicionarRelatorio(sel.id, texto.trim());
      setTexto('');
      mostrar('Relatório registrado', 'sucesso');
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao registrar', 'erro');
    } finally {
      setSalvando(false);
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

      <div className="bg-primary">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-bold text-white">Meus Casos</h1>
          <p className="mt-0.5 text-sm text-blue-200">
            {loading ? '...' : `${casos.length} ${casos.length === 1 ? 'caso' : 'casos'}`}
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-5">
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.status}
                type="button"
                onClick={() => setFiltro(f.status)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                  filtro === f.status ? 'bg-white text-primary' : 'border border-white/20 bg-white/10 text-blue-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Carregando...</p>
        ) : casos.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white">
            <EmptyState icone="📁" titulo="Você ainda não tem casos" descricao="Envie propostas em Oportunidades para começar a atuar." />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <aside className="overflow-hidden rounded-2xl bg-[#16314e] p-4">
              <ul className="space-y-1.5">
                {filtrados.map((c) => {
                  const ativo = c.id === selecionadoId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-current={ativo ? 'true' : undefined}
                        onClick={() => setSelecionadoId(c.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          ativo ? 'border-secondary bg-[#fdf6e3]' : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <p className={`text-sm font-bold leading-tight ${ativo ? 'text-primary' : 'text-slate-100'}`}>{c.titulo}</p>
                        <p className={`mt-1.5 text-[11px] ${ativo ? 'text-[#94795b]' : 'text-[#7e9bbd]'}`}>{c.cliente.nome}</p>
                      </button>
                    </li>
                  );
                })}
                {filtrados.length === 0 && <li className="py-6 text-center text-xs text-[#7e9bbd]">Nenhum caso neste filtro.</li>}
              </ul>
            </aside>

            <section className="rounded-2xl border border-slate-100 bg-white">
              {!sel ? (
                <EmptyState icone="👈" titulo="Selecione um caso" descricao="Escolha um caso para ver detalhes e registrar relatórios." />
              ) : (
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="flex-1 text-lg font-bold text-slate-800">{sel.titulo}</h2>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={sel.status} />
                      {souResponsavel && sel.status !== 'encerrado' && (
                        <button type="button" onClick={() => setEncerrarId(sel.id)} className="text-xs font-semibold text-erro hover:underline">
                          Encerrar caso
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cliente: {sel.cliente.nome}
                    {sel.cidade && sel.estado ? ` · 📍 ${sel.cidade}/${sel.estado}` : ''}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{sel.descricao}</p>
                  {minhaProposta && (
                    <p className="mt-3 text-sm text-slate-500">
                      Minha proposta: <b className="text-secondary">R$ {Number(minhaProposta.valorEstimado).toFixed(2)}</b> · {minhaProposta.status}
                    </p>
                  )}

                  <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Relatórios de situação ({sel.relatorios.length})
                  </p>

                  {souResponsavel ? (
                    <div className="mb-4">
                      <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder="Registrar andamento do caso..."
                        aria-label="Novo relatório de situação"
                        rows={2}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={registrarRelatorio}
                        disabled={salvando || texto.trim().length < 3}
                        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                      >
                        {salvando ? 'Registrando...' : 'Registrar relatório'}
                      </button>
                    </div>
                  ) : (
                    <p className="mb-4 text-xs text-slate-400">Apenas o advogado responsável (proposta aceita) registra relatórios.</p>
                  )}

                  {sel.relatorios.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">Nenhum relatório registrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {sel.relatorios.map((r) => (
                        <div key={r.id} className="rounded-xl border border-slate-100 p-3">
                          <p className="text-sm text-slate-700">{r.texto}</p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {r.advogado.nome} · {new Date(r.dataCriacao).toLocaleString('pt-BR')}
                          </p>
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
        aberto={encerrarId !== null}
        titulo="Encerrar caso"
        mensagem="Tem certeza que deseja encerrar este caso? Esta ação não pode ser desfeita."
        textoConfirmar="Encerrar"
        variante="reforcado"
        carregando={encerrando}
        onConfirmar={confirmarEncerramento}
        onCancelar={() => setEncerrarId(null)}
      />
    </div>
  );
}
