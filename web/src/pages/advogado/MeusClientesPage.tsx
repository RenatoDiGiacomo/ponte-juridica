import { useEffect, useState } from 'react';
import { conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';

const NAV = [
  { label: 'Oportunidades', to: '/' },
  { label: 'Meus Casos', to: '/meus-casos' },
  { label: 'Meus Clientes', to: '/meus-clientes' },
  { label: 'Meu Perfil', to: '/perfil' },
];

export function MeusClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conexoesService.meusClientes()
      .then(({ data }) => setClientes(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-white">Meus Clientes</h1>
          <p className="text-blue-200 mt-1 text-sm">
            {loading ? '...' : `${clientes.length} ${clientes.length === 1 ? 'cliente vinculado' : 'clientes vinculados'}`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-24 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="font-semibold text-slate-700 text-lg">Nenhum cliente vinculado ainda</p>
            <p className="text-slate-400 text-sm mt-2">
              Envie propostas para casos abertos e quando aceitas, o cliente aparece aqui
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {clientes.map((c, i) => {
              const cli = c.cliente;
              const ini = cli?.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? '?';
              const colors = ['bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${colors[i % colors.length]} flex items-center justify-center text-white font-black text-lg`}>
                        {ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800">{cli?.nome}</h3>
                        <p className="text-xs text-slate-400 truncate">{cli?.email}</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>Doc: <span className="font-mono">{cli?.documento}</span></span>
                      <span>desde {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
