import { useCallback, useEffect, useMemo, useState } from 'react';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { StatusBadge, type CasoStatus } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FilterChips } from '../../components/FilterChips';
import { useToast } from '../../components/Toast';

const NAV = [
  { label: 'Painel', to: '/painel' },
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const STATUS_OPCOES: { label: string; valor: CasoStatus | 'todos' }[] = [
  { label: 'Todos', valor: 'todos' },
  { label: 'Aberto', valor: 'aberto' },
  { label: 'Em atendimento', valor: 'em_atendimento' },
  { label: 'Encerrado', valor: 'encerrado' },
];

// Input de data sobre o hero navy (mesmo padrão visual da tela de Clientes)
const DATE_INPUT = 'min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-100 [color-scheme:dark]';

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
  const [dataDe, setDataDe] = useState('');
  const [dataAte, setDataAte] = useState('');
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [encerrarId, setEncerrarId] = useState<number | null>(null);
  const [encerrando, setEncerrando] = useState(false);
  // edição/exclusão de relatório
  const [editandoRelId, setEditandoRelId] = useState<number | null>(null);
  const [editTexto, setEditTexto] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [relExcluirId, setRelExcluirId] = useState<number | null>(null);
  const [excluindoRel, setExcluindoRel] = useState(false);
  const { mostrar } = useToast();

  const carregar = useCallback(async () => {
    const { data } = await processosService.meusCasosAdvogado();
    setCasos(data);
  }, []);

  useEffect(() => {
    carregar().finally(() => setLoading(false));
  }, [carregar]);

  const filtrados = useMemo(() => {
    const de = dataDe ? new Date(`${dataDe}T00:00:00`) : null;
    const ate = dataAte ? new Date(`${dataAte}T23:59:59`) : null;
    return casos.filter((c) => {
      if (filtro !== 'todos' && c.status !== filtro) return false;
      const d = new Date(c.dataCriacao);
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      return true;
    });
  }, [casos, filtro, dataDe, dataAte]);

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

  function iniciarEdicao(r: Relatorio) {
    setEditandoRelId(r.id);
    setEditTexto(r.texto);
  }

  async function salvarEdicao() {
    if (editandoRelId === null || editTexto.trim().length < 3) return;
    setSalvandoEdicao(true);
    try {
      await processosService.editarRelatorio(editandoRelId, editTexto.trim());
      setEditandoRelId(null);
      setEditTexto('');
      mostrar('Relatório atualizado', 'sucesso');
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao atualizar', 'erro');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function confirmarExclusaoRel() {
    if (relExcluirId === null) return;
    setExcluindoRel(true);
    try {
      await processosService.removerRelatorio(relExcluirId);
      setRelExcluirId(null);
      mostrar('Relatório excluído', 'sucesso');
      await carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao excluir', 'erro');
    } finally {
      setExcluindoRel(false);
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

      {/* Hero — título + filtros (mesmo padrão visual da tela de Clientes) */}
      <div className="bg-primary">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-bold text-white">Meus Casos</h1>
          <p className="mt-0.5 text-sm text-blue-200">
            {loading ? '...' : `${casos.length} ${casos.length === 1 ? 'caso' : 'casos'}`}
          </p>
        </div>
        {!loading && casos.length > 0 && (
          <div className="mx-auto max-w-6xl px-6 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <FilterChips opcoes={STATUS_OPCOES} valor={filtro} onChange={setFiltro} variante="escuro" />
              <label className="flex items-center gap-1 text-xs text-blue-200">
                De
                <input type="date" aria-label="Criado a partir de" value={dataDe} max={dataAte || undefined} onChange={(e) => setDataDe(e.target.value)} className={DATE_INPUT} />
              </label>
              <label className="flex items-center gap-1 text-xs text-blue-200">
                Até
                <input type="date" aria-label="Criado até" value={dataAte} min={dataDe || undefined} onChange={(e) => setDataAte(e.target.value)} className={DATE_INPUT} />
              </label>
              {(dataDe || dataAte || filtro !== 'todos') && (
                <button
                  type="button"
                  onClick={() => { setFiltro('todos'); setDataDe(''); setDataAte(''); }}
                  className="min-h-10 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/20"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}
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
                          {editandoRelId === r.id ? (
                            <div>
                              <textarea
                                value={editTexto}
                                onChange={(e) => setEditTexto(e.target.value)}
                                aria-label="Editar relatório"
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={salvarEdicao}
                                  disabled={salvandoEdicao || editTexto.trim().length < 3}
                                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                                >
                                  {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditandoRelId(null); setEditTexto(''); }}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700">{r.texto}</p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="text-[11px] text-slate-400">
                                  {r.advogado.nome} · {new Date(r.dataCriacao).toLocaleString('pt-BR')}
                                </p>
                                {souResponsavel && (
                                  <div className="flex shrink-0 gap-2">
                                    <button type="button" onClick={() => iniciarEdicao(r)} className="text-[11px] font-semibold text-primary hover:underline">
                                      Editar
                                    </button>
                                    <button type="button" onClick={() => setRelExcluirId(r.id)} className="text-[11px] font-semibold text-erro hover:underline">
                                      Excluir
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
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

      <ConfirmModal
        aberto={relExcluirId !== null}
        titulo="Excluir relatório"
        mensagem="Deseja excluir este relatório de situação? Esta ação não pode ser desfeita."
        textoConfirmar="Excluir"
        variante="reforcado"
        carregando={excluindoRel}
        onConfirmar={confirmarExclusaoRel}
        onCancelar={() => setRelExcluirId(null)}
      />
    </div>
  );
}
