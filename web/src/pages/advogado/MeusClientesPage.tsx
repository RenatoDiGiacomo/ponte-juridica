import { useCallback, useState } from 'react';
import { conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
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

export function MeusClientesPage() {
  const [busca, setBusca] = useState('');
  const buscaDeb = useDebounce(busca, 400);

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
                  <div key={c.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${CORES[i % CORES.length]} text-lg font-black text-white`}>{ini}</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800">{c.cliente.nome}</h3>
                        <p className="truncate text-xs text-slate-400">{c.cliente.email}</p>
                      </div>
                    </div>
                    <p className="border-t border-slate-50 pt-3 text-xs text-slate-400">Vinculado desde {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}</p>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
