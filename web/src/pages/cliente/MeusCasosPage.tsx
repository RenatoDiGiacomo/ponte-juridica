import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';

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

const STATUS: Record<string, { label: string; cls: string }> = {
  aberto: { label: 'Aberto', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  em_atendimento: { label: 'Em atendimento', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  encerrado: { label: 'Encerrado', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
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
  dataCriacao: string;
  propostas: Proposta[];
};

export function MeusCasosPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [propostaConfirmar, setPropostaConfirmar] = useState<Proposta | null>(null);
  const [aceitando, setAceitando] = useState(false);
  const { mostrar } = useToast();

  const carregar = useCallback(async () => {
    try {
      const { data } = await processosService.meus();
      setProcessos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function confirmarAceite() {
    if (!propostaConfirmar) return;
    setAceitando(true);
    try {
      await processosService.aceitarProposta(propostaConfirmar.id);
      setPropostaConfirmar(null);
      mostrar('Proposta aceita', 'sucesso');
      carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao aceitar', 'erro');
    } finally {
      setAceitando(false);
    }
  }

  async function recusarProposta(p: Proposta) {
    try {
      await processosService.recusarProposta(p.id);
      carregar();
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao recusar', 'erro');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      {/* Hero */}
      <div className="bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Casos</h1>
            <p className="text-blue-200 mt-1 text-sm">
              {loading ? '...' : `${processos.length} ${processos.length === 1 ? 'caso publicado' : 'casos publicados'}`}
            </p>
          </div>
          <Link
            to="/casos/novo"
            className="bg-secondary text-primary font-bold px-5 py-3 rounded-xl text-sm hover:bg-secondary/90 active:scale-[0.98] transition-all shadow-lg"
          >
            + Publicar caso
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Carregando...</p>
          </div>
        ) : processos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-24 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="font-semibold text-slate-700 text-lg">Você ainda não publicou nenhum caso</p>
            <p className="text-slate-400 text-sm mt-2 mb-6">
              Publique seu caso e advogados especializados vão te enviar propostas
            </p>
            <Link
              to="/casos/novo"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              + Publicar primeiro caso
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {processos.map((p) => {
              const st = STATUS[p.status] ?? STATUS.aberto;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-slate-800 text-lg flex-1">{p.titulo}</h3>
                      <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ring-1 ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <span className="inline-block text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full mb-3">
                      {ESP_ICONS[p.especializacao] ?? '⚖️'} {p.especializacao}
                    </span>
                    <p className="text-slate-600 text-sm leading-relaxed">{p.descricao}</p>
                    <p className="text-xs text-slate-400 mt-3">
                      Publicado em {new Date(p.dataCriacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {p.propostas.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Propostas recebidas ({p.propostas.length})
                      </p>
                      <div className="space-y-2">
                        {p.propostas.map((pr) => (
                          <div key={pr.id} className="bg-white rounded-xl border border-slate-100 p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="font-bold text-slate-800">{pr.advogado.nome}</p>
                                <p className="text-xs text-slate-400">
                                  OAB {pr.advogado.oab} · {pr.advogado.especializacao}
                                </p>
                              </div>
                              <p className="font-bold text-secondary text-lg shrink-0">
                                R$ {Number(pr.valorEstimado).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-slate-600 text-sm">{pr.mensagem}</p>

                            {pr.status === 'pendente' && p.status === 'aberto' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  type="button"
                                  onClick={() => setPropostaConfirmar(pr)}
                                  className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                                >
                                  ✓ Aceitar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => recusarProposta(pr)}
                                  className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
                                >
                                  Recusar
                                </button>
                              </div>
                            )}
                            {pr.status === 'aceita' && (
                              <p className="mt-2 text-emerald-700 font-bold text-sm">✓ Proposta aceita</p>
                            )}
                            {pr.status === 'recusada' && (
                              <p className="mt-2 text-slate-400 text-sm">Recusada</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
    </div>
  );
}
