import { useEffect, useState } from 'react';
import { advogadosService, processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

const PLAN_STYLE: Record<string, string> = {
  Básico: 'bg-slate-100 text-slate-700 ring-slate-200',
  Profissional: 'bg-blue-100 text-blue-700 ring-blue-200',
  Elite: 'bg-amber-100 text-amber-700 ring-amber-300',
};

type Quota = {
  plano: string;
  limite: number | null;
  usadas: number;
  restantes: number | null;
};

export function PerfilAdvogadoPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([advogadosService.meuPerfil(), processosService.quota()])
      .then(([{ data: p }, { data: q }]) => { setPerfil(p); setQuota(q); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar items={NAV} />
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const ini = perfil?.nome?.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('') ?? '?';
  const plano = perfil?.plano;
  const planStyle = PLAN_STYLE[plano?.nome] ?? PLAN_STYLE['Básico'];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      {/* Hero */}
      <div className="bg-primary">
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-2xl">
            {ini}
          </div>
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">Portal do Advogado</p>
            <h1 className="text-2xl font-extrabold text-white">{perfil?.nome}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-blue-200 text-sm">{perfil?.especializacao}</span>
              <span className="text-blue-300 text-sm">·</span>
              <span className="text-blue-200 text-sm">OAB {perfil?.oab}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plano */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plano atual</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{plano?.nome}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ring-1 ${planStyle}`}>
              {perfil?.assinatura ?? 'ativo'}
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            R$ {Number(plano?.valorMensal).toFixed(2)}/mês · R$ {Number(plano?.valorAnual).toFixed(2)}/ano
          </p>
        </div>

        {/* Quota */}
        {quota && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Propostas neste mês</p>
            {quota.limite === null ? (
              <>
                <p className="text-3xl font-extrabold text-emerald-600">{quota.usadas}</p>
                <p className="text-slate-500 text-sm mt-1">Plano com envio ilimitado</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-extrabold text-slate-800">
                  {quota.usadas}<span className="text-slate-400 text-xl"> / {quota.limite}</span>
                </p>
                <p className={`text-sm mt-1 font-medium ${
                  quota.restantes === 0 ? 'text-red-600' :
                  (quota.restantes ?? 0) <= 2 ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  {quota.restantes} restantes neste mês
                </p>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      quota.restantes === 0 ? 'bg-red-500' :
                      (quota.restantes ?? 0) <= 2 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, (quota.usadas / quota.limite) * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:col-span-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Estatísticas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-extrabold text-primary">{perfil?.conexoes?.length ?? 0}</p>
              <p className="text-slate-500 text-sm mt-1">Clientes vinculados</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-secondary">
                {new Date(perfil?.dataCadastro).getFullYear()}
              </p>
              <p className="text-slate-500 text-sm mt-1">Membro desde</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-slate-700 capitalize">{perfil?.assinatura ?? '—'}</p>
              <p className="text-slate-500 text-sm mt-1">Assinatura</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
