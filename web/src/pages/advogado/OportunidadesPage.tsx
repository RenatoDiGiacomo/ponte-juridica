import { useCallback, useEffect, useState } from 'react';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const AREAS = [
  { label: 'Minha área', icon: '⭐' },
  { label: 'Criminal', icon: '🔒' },
  { label: 'Trabalhista', icon: '🏭' },
  { label: 'Família', icon: '👨‍👩‍👧' },
  { label: 'Cível', icon: '📋' },
  { label: 'Tributário', icon: '💰' },
  { label: 'Previdenciário', icon: '🛡️' },
];

type ProcessoAberto = {
  id: number;
  titulo: string;
  descricao: string;
  especializacao: string;
  dataCriacao: string;
  cliente: { id: number; nome: string };
  _count: { propostas: number };
};

type Quota = {
  plano: string;
  limite: number | null;
  usadas: number;
  restantes: number | null;
};

export function OportunidadesPage() {
  const [processos, setProcessos] = useState<ProcessoAberto[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [filtro, setFiltro] = useState('Minha área');
  const [loading, setLoading] = useState(true);

  // Modal de envio de proposta
  const [modalProcesso, setModalProcesso] = useState<ProcessoAberto | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const esp = filtro === 'Minha área' ? undefined : filtro;
      const [lista, q] = await Promise.all([
        processosService.abertos(esp),
        processosService.quota(),
      ]);
      setProcessos(lista.data);
      setQuota(q.data);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirModal(p: ProcessoAberto) {
    setModalProcesso(p);
    setMensagem('');
    setValor('');
    setErroModal('');
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
      await processosService.enviarProposta(modalProcesso.id, {
        mensagem,
        valorEstimado: valorNum,
      });
      setModalProcesso(null);
      carregar();
    } catch (err: any) {
      setErroModal(err.response?.data?.message ?? 'Falha ao enviar proposta');
    } finally {
      setEnviando(false);
    }
  }

  const quotaCor =
    !quota || quota.limite === null
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : quota.restantes === 0
      ? 'bg-red-50 border-red-200 text-red-800'
      : (quota.restantes ?? 0) <= 2
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      {/* Hero */}
      <div className="bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-white">Oportunidades</h1>
          <p className="text-blue-200 mt-1 text-sm">
            Casos abertos esperando por um advogado
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Banner de quota */}
        {quota && (
          <div className={`border rounded-2xl px-5 py-4 mb-6 ${quotaCor}`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1">Plano {quota.plano}</p>
                <p className="font-bold">
                  {quota.limite === null
                    ? `${quota.usadas} propostas neste mês · ilimitado`
                    : `${quota.usadas} / ${quota.limite} propostas usadas neste mês`}
                </p>
              </div>
              {quota.limite !== null && quota.restantes !== null && (
                <div className="text-right hidden sm:block">
                  <p className="text-3xl font-extrabold">{quota.restantes}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider">restantes</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {AREAS.map(({ label, icon }) => (
            <button
              type="button"
              key={label}
              onClick={() => setFiltro(label)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                filtro === label
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
              }`}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Carregando...</p>
          </div>
        ) : processos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-24 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-semibold text-slate-700 text-lg">Nenhum caso aberto agora</p>
            <p className="text-slate-400 text-sm mt-2">
              Quando um cliente publicar um caso na sua área, ele aparece aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {processos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg">{p.titulo}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                          {p.especializacao}
                        </span>
                        <span className="text-xs text-slate-400">
                          por {p.cliente.nome}
                        </span>
                        <span className="text-xs text-slate-400">
                          {p._count.propostas} {p._count.propostas === 1 ? 'proposta' : 'propostas'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => abrirModal(p)}
                      disabled={!!(quota && quota.limite !== null && quota.restantes === 0)}
                      className="shrink-0 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        quota && quota.limite !== null && quota.restantes === 0
                          ? 'Limite do plano atingido'
                          : 'Enviar proposta'
                      }
                    >
                      Enviar proposta
                    </button>
                  </div>
                  <p className="text-slate-600 text-sm mt-3">{p.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalProcesso && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enviar proposta para</p>
                  <h2 className="text-xl font-bold text-slate-800 mt-1">{modalProcesso.titulo}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalProcesso(null)}
                  className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-3">{modalProcesso.descricao}</p>
            </div>

            <form onSubmit={enviarProposta} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Sua mensagem
                </label>
                <textarea
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Apresente-se e diga como pode ajudar nesse caso."
                  rows={5}
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:border-primary bg-slate-50 focus:bg-white resize-y"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Valor estimado (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 1500"
                  className="w-full border-2 border-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder-slate-300 focus:outline-none focus:border-primary bg-slate-50 focus:bg-white"
                />
              </div>

              {erroModal && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                  <span>⚠️</span> {erroModal}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalProcesso(null)}
                  className="px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Enviar proposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
