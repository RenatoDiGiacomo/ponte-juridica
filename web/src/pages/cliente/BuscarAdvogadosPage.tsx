import { useCallback, useState } from 'react';
import { advogadosService, conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { usePaginatedQuery, type Paginated } from '../../hooks/usePaginatedQuery';

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Vinculados', to: '/minhas-conexoes' },
  { label: 'Minha Conta', to: '/perfil' },
];

const AREAS = ['', 'Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];
const UFS = ['', 'SP', 'RJ', 'MG', 'RS', 'BA', 'PR', 'SC', 'DF'];
const PLAN_STYLE: Record<string, string> = {
  Básico: 'bg-slate-100 text-slate-600 ring-slate-200',
  Profissional: 'bg-blue-50 text-blue-700 ring-blue-200',
  Elite: 'bg-amber-50 text-amber-700 ring-amber-300',
};
const AVATARS = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];

type Advogado = {
  id: number; nome: string; oab: string; areas: string[]; especializacao?: string;
  nota: number | null; estadoAtuacao: string | null; cidadeAtuacao: string | null;
  plano?: { id: number; nome: string };
};

const SELECT = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600';

export function BuscarAdvogadosPage() {
  const [area, setArea] = useState('');
  const [notaMin, setNotaMin] = useState('');
  const [estado, setEstado] = useState('');
  const [vinculo, setVinculo] = useState('');
  const [conectando, setConectando] = useState<number | null>(null);
  const [conectados, setConectados] = useState<Set<number>>(new Set());
  const { mostrar } = useToast();

  const fetcher = useCallback(
    ({ page, pageSize, signal }: { page: number; pageSize: number; signal: AbortSignal }) =>
      advogadosService.pesquisar(
          {
            page,
            pageSize,
            ...(area && { area }),
            ...(notaMin && { notaMin: Number(notaMin) }),
            ...(estado && { estado }),
            ...(vinculo && { vinculo }),
          },
          signal,
        )
        .then((r) => r.data as Paginated<Advogado>),
    [area, notaMin, estado, vinculo],
  );

  const { data, total, page, setPage, totalPages, loading } = usePaginatedQuery<Advogado>(fetcher, {
    pageSize: 9,
    deps: [area, notaMin, estado, vinculo],
  });

  async function conectar(id: number) {
    setConectando(id);
    try {
      await conexoesService.conectar(id);
      setConectados((prev) => new Set(prev).add(id));
      mostrar('Solicitação enviada', 'sucesso');
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Erro ao criar vínculo', 'erro');
    } finally {
      setConectando(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-300">Marketplace Jurídico</p>
          <h1 className="text-3xl font-extrabold leading-tight text-white">Encontre o advogado certo</h1>
          <p className="mt-2 text-sm text-blue-200">Filtre por área, reputação, região e vínculo.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select aria-label="Área" value={area} onChange={(e) => setArea(e.target.value)} className={SELECT}>
            {AREAS.map((a) => <option key={a} value={a}>{a === '' ? 'Todas as áreas' : a}</option>)}
          </select>
          <select aria-label="Nota mínima" value={notaMin} onChange={(e) => setNotaMin(e.target.value)} className={SELECT}>
            <option value="">Qualquer nota</option>
            <option value="3">★ 3+</option>
            <option value="4">★ 4+</option>
            <option value="4.5">★ 4,5+</option>
          </select>
          <select aria-label="Estado de atuação" value={estado} onChange={(e) => setEstado(e.target.value)} className={SELECT}>
            {UFS.map((u) => <option key={u} value={u}>{u === '' ? 'Todos os estados' : u}</option>)}
          </select>
          <select aria-label="Vínculo" value={vinculo} onChange={(e) => setVinculo(e.target.value)} className={SELECT}>
            <option value="">Todos</option>
            <option value="nao">Ainda não vinculados</option>
            <option value="vinculado">Já vinculados</option>
          </select>
        </div>

        {!loading && <p className="mb-5 text-sm text-slate-500"><span className="font-bold text-slate-800">{total}</span> {total === 1 ? 'advogado' : 'advogados'}</p>}

        {loading ? (
          <p className="py-16 text-center text-sm text-slate-400">Carregando...</p>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white">
            <EmptyState icone="🔍" titulo="Nenhum resultado" descricao="Tente afrouxar os filtros (nota menor, outra área ou estado)." />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.map((adv, i) => {
                const ini = adv.nome.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('');
                const planStyle = PLAN_STYLE[adv.plano?.nome ?? 'Básico'] ?? PLAN_STYLE['Básico'];
                const conectado = conectados.has(adv.id);
                return (
                  <div key={adv.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-lg">
                    <div className="h-2 bg-linear-to-r from-primary to-blue-400" />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-4 flex items-start gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${AVATARS[i % AVATARS.length]} text-lg font-black text-white`}>{ini}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-bold leading-snug text-slate-800">{adv.nome}</h3>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${planStyle}`}>{adv.plano?.nome}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {adv.areas.map((a) => (
                              <span key={a} className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-semibold text-primary">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4 flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-400">
                        <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 font-mono font-medium text-slate-500">OAB {adv.oab}</span>
                        <span className="font-bold text-secondary">★ {adv.nota ?? '—'}</span>
                      </div>
                      <p className="mb-4 text-xs text-slate-400">📍 {adv.cidadeAtuacao ?? '—'}{adv.estadoAtuacao ? `/${adv.estadoAtuacao}` : ''}</p>
                      <button
                        type="button"
                        onClick={() => conectar(adv.id)}
                        disabled={conectando === adv.id || conectado}
                        className={`mt-auto w-full rounded-xl py-3 text-sm font-bold transition-all ${conectado ? 'cursor-default bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-70'}`}
                      >
                        {conectando === adv.id ? 'Solicitando...' : conectado ? '✓ Contato solicitado' : 'Solicitar contato'}
                      </button>
                    </div>
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
