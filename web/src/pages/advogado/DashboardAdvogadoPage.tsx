import { useEffect, useState } from 'react';
import { advogadosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Skeleton } from '../../components/Skeleton';

const NAV = [
  { label: 'Painel', to: '/' },
  { label: 'Oportunidades', to: '/oportunidades' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

type Dash = {
  ano: number; mes: number;
  periodo: { propostasEnviadas: number; propostasAceitas: number; taxaAceite: number; faturamentoEstimado: number; novosClientes: number };
  atual: { casosAtivos: number; clientesVinculados: number; notaMedia: number | null; totalAvaliacoes: number };
  serie: { mes: number; enviadas: number; aceitas: number }[];
};

const MESES = ['Ano inteiro', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MES_ABREV = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
// Paleta categórica validada (dataviz): azul = enviadas, âmbar = aceitas.
const COR_ENVIADAS = '#2563eb';
const COR_ACEITAS = '#d97706';
const ANO_ATUAL = new Date().getFullYear();
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Kpi({ icone, valor, label, cor }: { icone: string; valor: string | number; label: string; cor: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${cor}`}>{icone}</div>
      <p className="text-2xl font-extrabold text-slate-800">{valor}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

/** Gráfico de barras agrupadas (12 meses × enviadas/aceitas), SVG puro. */
function GraficoMensal({ serie, mesSelecionado, onSelecionarMes }: { serie: Dash['serie']; mesSelecionado: number; onSelecionarMes: (m: number) => void }) {
  const max = Math.max(1, ...serie.map((s) => Math.max(s.enviadas, s.aceitas)));
  const W = 640, H = 200, padB = 24, padT = 8, padL = 8;
  const alturaUtil = H - padB - padT;
  const larguraUtil = W - padL * 2;
  const grupo = larguraUtil / 12;
  const barW = grupo * 0.32;
  const y = (v: number) => padT + alturaUtil - (v / max) * alturaUtil;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Propostas enviadas e aceitas por mês">
        {/* linhas de grade horizontais */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={W - padL} y1={padT + alturaUtil * (1 - f)} y2={padT + alturaUtil * (1 - f)} stroke="#eef2f6" strokeWidth={1} />
        ))}
        {serie.map((s, i) => {
          const gx = padL + i * grupo + grupo / 2;
          const selecionado = mesSelecionado === 0 || mesSelecionado === s.mes;
          const op = selecionado ? 1 : 0.28;
          return (
            <g key={s.mes} onClick={() => onSelecionarMes(mesSelecionado === s.mes ? 0 : s.mes)} style={{ cursor: 'pointer' }}>
              <rect x={padL + i * grupo} y={padT} width={grupo} height={alturaUtil} fill="transparent" />
              <rect x={gx - barW - 1} y={y(s.enviadas)} width={barW} height={padT + alturaUtil - y(s.enviadas)} rx={4} fill={COR_ENVIADAS} opacity={op}>
                <title>{MESES[s.mes]}: {s.enviadas} enviadas</title>
              </rect>
              <rect x={gx + 1} y={y(s.aceitas)} width={barW} height={padT + alturaUtil - y(s.aceitas)} rx={4} fill={COR_ACEITAS} opacity={op}>
                <title>{MESES[s.mes]}: {s.aceitas} aceitas</title>
              </rect>
              <text x={gx} y={H - 8} textAnchor="middle" className="fill-slate-400" fontSize={11} fontWeight={mesSelecionado === s.mes ? 700 : 400}>
                {MES_ABREV[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_ENVIADAS }} /> Enviadas</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_ACEITAS }} /> Aceitas</span>
        <span className="ml-auto text-slate-400">Clique num mês para filtrar</span>
      </div>
    </div>
  );
}

export function DashboardAdvogadoPage() {
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(ANO_ATUAL);
  const [mes, setMes] = useState(0); // 0 = ano inteiro

  useEffect(() => {
    setLoading(true);
    advogadosService.dashboard(ano, mes || undefined).then((r) => setD(r.data)).finally(() => setLoading(false));
  }, [ano, mes]);

  const p = d?.periodo;
  const a = d?.atual;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      {/* Hero com navegação de período */}
      <div className="bg-linear-to-br from-primary to-[#12283f]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">Painel</h1>
              <p className="mt-0.5 text-sm text-blue-200">Sua atuação na Ponte Jurídica — {mes ? `${MESES[mes]} de ${ano}` : `ano de ${ano}`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Navegação de ano */}
              <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
                <button type="button" onClick={() => setAno((v) => v - 1)} aria-label="Ano anterior" className="rounded-lg px-2.5 py-1 text-white hover:bg-white/15">‹</button>
                <span className="min-w-14 text-center text-sm font-bold text-white">{ano}</span>
                <button type="button" onClick={() => setAno((v) => Math.min(ANO_ATUAL, v + 1))} disabled={ano >= ANO_ATUAL} aria-label="Próximo ano" className="rounded-lg px-2.5 py-1 text-white hover:bg-white/15 disabled:opacity-30">›</button>
              </div>
              {/* Navegação de mês */}
              <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
                <button type="button" onClick={() => setMes((v) => Math.max(0, v - 1))} aria-label="Mês anterior" className="rounded-lg px-2.5 py-1 text-white hover:bg-white/15">‹</button>
                <span className="min-w-24 text-center text-sm font-bold text-white">{MESES[mes]}</span>
                <button type="button" onClick={() => setMes((v) => Math.min(12, v + 1))} aria-label="Próximo mês" className="rounded-lg px-2.5 py-1 text-white hover:bg-white/15">›</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading || !d || !p || !a ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            {/* KPIs do período */}
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">No período selecionado</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
              <Kpi icone="📩" valor={p.propostasEnviadas} label="Propostas enviadas" cor="bg-blue-50" />
              <Kpi icone="✅" valor={p.propostasAceitas} label="Propostas aceitas" cor="bg-emerald-50" />
              <Kpi icone="📈" valor={`${p.taxaAceite}%`} label="Taxa de aceite" cor="bg-violet-50" />
              <Kpi icone="💰" valor={brl(p.faturamentoEstimado)} label="Faturamento estimado" cor="bg-amber-50" />
              <Kpi icone="🤝" valor={p.novosClientes} label="Novos clientes" cor="bg-rose-50" />
            </div>

            {/* Gráfico mensal + conversão */}
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Propostas por mês — {ano}</p>
                  {mes > 0 && (
                    <button type="button" onClick={() => setMes(0)} className="text-xs font-semibold text-primary hover:underline">Ver ano inteiro</button>
                  )}
                </div>
                <GraficoMensal serie={d.serie} mesSelecionado={mes} onSelecionarMes={setMes} />
              </div>

              {/* Conversão (donut simplificado + barra) */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="mb-3 text-sm font-bold text-slate-700">Conversão no período</p>
                <div className="flex items-center gap-4">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef2f6" strokeWidth="3.6" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={COR_ACEITAS} strokeWidth="3.6" strokeLinecap="round" strokeDasharray={`${p.taxaAceite} ${100 - p.taxaAceite}`} />
                    </svg>
                    <span className="absolute text-lg font-extrabold text-slate-800">{p.taxaAceite}%</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p><span className="font-bold text-slate-800">{p.propostasAceitas}</span> de <span className="font-bold text-slate-800">{p.propostasEnviadas}</span></p>
                    <p>propostas aceitas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Situação atual (não depende do período) */}
            <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Situação atual</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Kpi icone="⚖️" valor={a.casosAtivos} label="Casos em atendimento" cor="bg-sky-50" />
              <Kpi icone="👥" valor={a.clientesVinculados} label="Clientes vinculados" cor="bg-cyan-50" />
              <Kpi icone="⭐" valor={a.notaMedia != null ? a.notaMedia.toFixed(1) : '—'} label={`Nota média (${a.totalAvaliacoes} ${a.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})`} cor="bg-yellow-50" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
