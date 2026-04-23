import { useState, useEffect } from 'react';
import { advogadosService, conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';

const NAV = [{ label: 'Dashboard', to: '/' }];

const PLAN_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Básico:       { bg: 'bg-slate-100',  text: 'text-slate-600', dot: 'bg-slate-400' },
  Profissional: { bg: 'bg-blue-100',   text: 'text-blue-700',  dot: 'bg-blue-500' },
  Elite:        { bg: 'bg-amber-100',  text: 'text-amber-700', dot: 'bg-amber-500' },
};

const ROW_COLORS = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-rose-600', 'bg-amber-600', 'bg-cyan-600',
];

export function DashboardAdvogadoPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([advogadosService.meuPerfil(), conexoesService.meusClientes()])
      .then(([{ data: p }, { data: c }]) => { setPerfil(p); setClientes(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Carregando dashboard...</p>
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

      {/* Top banner */}
      <div className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.06),_transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 py-10 relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg">
              {ini}
            </div>
            <div>
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-1">Portal do Advogado</p>
              <h1 className="text-2xl font-extrabold text-white">{perfil?.nome}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="text-blue-200 text-sm font-medium">{perfil?.especializacao}</span>
                <span className="text-blue-400 text-xs">·</span>
                <span className="font-mono text-blue-200 text-sm">OAB {perfil?.oab}</span>
              </div>
            </div>
          </div>

          <div className="md:ml-auto flex flex-wrap gap-3">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${planStyle.bg} ${planStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${planStyle.dot}`} />
              Plano {plano?.nome}
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              perfil?.assinatura === 'ativo'
                ? 'bg-emerald-400/20 text-emerald-200'
                : 'bg-yellow-400/20 text-yellow-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${perfil?.assinatura === 'ativo' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
              {perfil?.assinatura === 'ativo' ? 'Assinatura ativa' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Clientes vinculados',
              value: clientes.length,
              icon: '👥',
              sub: clientes.length === 0 ? 'Aguardando contatos' : 'clientes ativos',
              color: 'text-primary',
              bg: 'bg-blue-50',
            },
            {
              label: 'Plano atual',
              value: plano?.nome ?? '—',
              icon: '⭐',
              sub: `R$ ${Number(plano?.valorMensal ?? 0).toFixed(2)}/mês`,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'Status',
              value: perfil?.assinatura === 'ativo' ? 'Ativo' : 'Pendente',
              icon: perfil?.assinatura === 'ativo' ? '✅' : '⏳',
              sub: 'Assinatura',
              color: perfil?.assinatura === 'ativo' ? 'text-emerald-600' : 'text-yellow-600',
              bg: perfil?.assinatura === 'ativo' ? 'bg-emerald-50' : 'bg-yellow-50',
            },
            {
              label: 'Avaliação',
              value: '5.0',
              icon: '★',
              sub: 'Nota média',
              color: 'text-amber-500',
              bg: 'bg-amber-50',
            },
          ].map(({ label, value, icon, sub, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{icon}</span>
              </div>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">{label}</p>
              <p className="text-slate-400 text-xs mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Clients table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Clientes Vinculados</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {clientes.length === 0 ? 'Nenhum cliente ainda' : `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`}
              </p>
            </div>
            {clientes.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                {clientes.length} ativo{clientes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {clientes.length === 0 ? (
            <div className="py-24 text-center">
              <div className="text-5xl mb-4">📬</div>
              <p className="font-bold text-slate-600 text-lg">Nenhum cliente ainda</p>
              <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
                Seu perfil está visível no marketplace. Quando um cliente solicitar contato, ele aparecerá aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-5">Cliente</div>
                <div className="col-span-4">E-mail</div>
                <div className="col-span-2">Vinculado em</div>
                <div className="col-span-1" />
              </div>

              <div className="divide-y divide-slate-50">
                {clientes.map((c, i) => {
                  const nome = c.cliente?.nome ?? '—';
                  const email = c.cliente?.email ?? '—';
                  const ini2 = nome.split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('');
                  const color = ROW_COLORS[i % ROW_COLORS.length];
                  return (
                    <div key={c.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {ini2}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{nome}</p>
                          <p className="text-slate-400 text-xs md:hidden">{email}</p>
                        </div>
                      </div>
                      <div className="col-span-4 hidden md:block">
                        <p className="text-slate-500 text-sm truncate">{email}</p>
                      </div>
                      <div className="col-span-2 hidden md:block">
                        <p className="text-slate-400 text-sm">
                          {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <a
                          href={`mailto:${email}`}
                          title="Enviar e-mail"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-primary hover:text-white text-slate-500 text-sm transition-colors"
                        >
                          ✉️
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Plan info card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seu plano</p>
            <h3 className="text-xl font-extrabold text-slate-800">{plano?.nome}</h3>
            <p className="text-slate-400 text-sm mt-1">
              R$ {Number(plano?.valorMensal ?? 0).toFixed(2)}/mês · R$ {Number(plano?.valorAnual ?? 0).toFixed(2)}/ano
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-5 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-lg font-extrabold text-primary">{clientes.length}</p>
              <p className="text-xs text-slate-400 font-medium">Clientes</p>
            </div>
            <div className="text-center px-5 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-lg font-extrabold text-amber-500">5.0 ★</p>
              <p className="text-xs text-slate-400 font-medium">Avaliação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
