import { useCallback, useState } from 'react';
import { conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge, type CasoStatus } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useDebounce } from '../../hooks/useDebounce';
import { usePaginatedQuery, type Paginated } from '../../hooks/usePaginatedQuery';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const CORES = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];

type Vinculo = { id: number; dataVinculo: string; cliente: { id: number; nome: string; email: string } };
type CasoCliente = {
  id: number;
  titulo: string;
  especializacao: string;
  status: CasoStatus;
  dataCriacao: string;
  minhaProposta: { status: string; valorEstimado: string } | null;
};
type ClienteDetalhe = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  enderecoCidade: string | null;
  enderecoEstado: string | null;
  dataCadastro: string;
  vinculadoDesde: string;
  casos: CasoCliente[];
};

export function MeusClientesPage() {
  const [busca, setBusca] = useState('');
  const buscaDeb = useDebounce(busca, 400);
  const [detalhe, setDetalhe] = useState<ClienteDetalhe | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const { mostrar } = useToast();

  const fetcher = useCallback(
    ({ page, pageSize, signal }: { page: number; pageSize: number; signal: AbortSignal }) =>
      conexoesService
        .meusClientes({ page, pageSize, ...(buscaDeb && { busca: buscaDeb }) }, signal)
        .then((r) => r.data as Paginated<Vinculo>),
    [buscaDeb],
  );

  const { data, total, page, setPage, totalPages, loading } = usePaginatedQuery<Vinculo>(fetcher, {
    pageSize: 12,
    deps: [buscaDeb],
  });

  async function abrirDetalhe(clienteId: number) {
    setModalAberto(true);
    setDetalhe(null);
    setCarregandoDetalhe(true);
    try {
      const { data } = await conexoesService.detalheCliente(clienteId);
      setDetalhe(data);
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Falha ao carregar dados do cliente', 'erro');
      setModalAberto(false);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-bold text-white">Meus Clientes</h1>
          <p className="mt-0.5 text-sm text-blue-200">{loading ? '...' : `${total} ${total === 1 ? 'cliente vinculado' : 'clientes vinculados'}`}</p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-5">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔍 Buscar por nome ou CPF/CNPJ..."
            aria-label="Buscar cliente"
            className="w-full max-w-md rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-200"
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Carregando...</p>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white">
            <EmptyState icone="👥" titulo={busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente vinculado ainda'} descricao={busca ? 'Tente outro nome ou documento.' : 'Quando uma proposta sua for aceita, o cliente aparece aqui.'} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.map((c, i) => {
                const ini = c.cliente.nome.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('');
                return (
                  <div key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${CORES[i % CORES.length]} text-lg font-black text-white`}>{ini}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800">{c.cliente.nome}</h3>
                        <p className="truncate text-xs text-slate-400">{c.cliente.email}</p>
                      </div>
                    </div>
                    <p className="border-t border-slate-50 pt-3 text-xs text-slate-400">Vinculado desde {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}</p>
                    <button
                      type="button"
                      onClick={() => abrirDetalhe(c.cliente.id)}
                      className="mt-3 rounded-lg bg-primary/10 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      Ver dados
                    </button>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo={detalhe ? detalhe.nome : 'Dados do cliente'}>
        {carregandoDetalhe || !detalhe ? (
          <p className="py-6 text-center text-sm text-slate-400">Carregando...</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p>✉️ {detalhe.email}</p>
              {detalhe.telefone && <p>📞 {detalhe.telefone}</p>}
              {(detalhe.enderecoCidade || detalhe.enderecoEstado) && (
                <p>📍 {[detalhe.enderecoCidade, detalhe.enderecoEstado].filter(Boolean).join('/')}</p>
              )}
              <p className="text-xs text-slate-400">
                Cliente desde {new Date(detalhe.dataCadastro).toLocaleDateString('pt-BR')} · vinculado a você desde {new Date(detalhe.vinculadoDesde).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Casos com você ({detalhe.casos.length})
              </p>
              {detalhe.casos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">Nenhum caso compartilhado.</p>
              ) : (
                <div className="space-y-2">
                  {detalhe.casos.map((caso) => (
                    <div key={caso.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 text-sm font-semibold text-slate-800">{caso.titulo}</p>
                        <StatusBadge status={caso.status} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span className="rounded-full bg-primary/8 px-2 py-0.5 font-semibold text-primary">{caso.especializacao}</span>
                        {caso.minhaProposta && (
                          <span>Proposta R$ {Number(caso.minhaProposta.valorEstimado).toFixed(2)} · {caso.minhaProposta.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
