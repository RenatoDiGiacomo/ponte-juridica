import { useEffect, useState } from 'react';
import { advogadosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Skeleton } from '../../components/Skeleton';

const NAV = [
  { label: 'Painel', to: '/painel' },
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

type Metrics = {
  propostasEnviadas: number; propostasAceitas: number; taxaAceite: number;
  casosAtivos: number; casosEncerrados: number; clientesVinculados: number;
  notaMedia: number | null; totalAvaliacoes: number; faturamentoEstimado: number;
};

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Card({ icone, valor, label, cor }: { icone: string; valor: string | number; label: string; cor: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${cor}`}>{icone}</div>
      <p className="text-2xl font-extrabold text-slate-800">{valor}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function DashboardAdvogadoPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    advogadosService.dashboard().then((r) => setM(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h1 className="text-xl font-bold text-white">Painel</h1>
          <p className="mt-0.5 text-sm text-blue-200">Sua atuação na Ponte Jurídica em números</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {loading || !m ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card icone="📩" valor={m.propostasEnviadas} label="Propostas enviadas" cor="bg-blue-50" />
              <Card icone="✅" valor={m.propostasAceitas} label="Propostas aceitas" cor="bg-emerald-50" />
              <Card icone="📈" valor={`${m.taxaAceite}%`} label="Taxa de aceite" cor="bg-violet-50" />
              <Card icone="💰" valor={brl(m.faturamentoEstimado)} label="Faturamento estimado" cor="bg-amber-50" />
              <Card icone="⚖️" valor={m.casosAtivos} label="Casos em atendimento" cor="bg-sky-50" />
              <Card icone="📁" valor={m.casosEncerrados} label="Casos encerrados" cor="bg-slate-100" />
              <Card icone="👥" valor={m.clientesVinculados} label="Clientes vinculados" cor="bg-rose-50" />
              <Card
                icone="⭐"
                valor={m.notaMedia != null ? m.notaMedia.toFixed(1) : '—'}
                label={`Nota média (${m.totalAvaliacoes} ${m.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})`}
                cor="bg-yellow-50"
              />
            </div>

            {/* Taxa de aceite — barra */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Conversão de propostas</p>
                <p className="text-sm font-semibold text-primary">{m.propostasAceitas}/{m.propostasEnviadas} aceitas</p>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${m.taxaAceite}%` }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
