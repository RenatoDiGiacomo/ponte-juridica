import { useState, useEffect } from 'react';
import { advogadosService, conexoesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardAdvogadoPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    Promise.all([advogadosService.meuPerfil(), conexoesService.minhas()])
      .then(([{ data: p }, { data: c }]) => { setPerfil(p); setClientes(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Ponte Jurídica</h1>
        <button onClick={logout} className="text-blue-300 hover:text-white text-sm">Sair</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-2xl mb-4">
              {perfil?.nome?.[0]}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{perfil?.nome}</h2>
            <p className="text-secondary font-medium">{perfil?.especializacao}</p>
            <p className="text-gray-400 text-sm mt-1">OAB: {perfil?.oab}</p>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                perfil?.assinatura === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {perfil?.assinatura}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Plano atual</p>
            <p className="text-primary font-bold text-lg">{perfil?.plano?.nome}</p>
            <p className="text-gray-500 text-sm">R$ {Number(perfil?.plano?.valorMensal).toFixed(2)}/mês</p>
          </div>

          <div className="bg-primary text-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl font-bold">{clientes.length}</p>
            <p className="text-blue-200 mt-1 text-sm">Clientes vinculados</p>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Meus Clientes</h3>
          {clientes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
              <p className="text-lg">Nenhum cliente ainda</p>
              <p className="text-sm mt-2">Clientes aparecerão aqui quando solicitarem contato</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientes.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold mr-4 shrink-0">
                    {c.cliente?.nome?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{c.cliente?.nome}</p>
                    <p className="text-gray-400 text-sm">{c.cliente?.email}</p>
                  </div>
                  <p className="text-gray-300 text-xs">
                    {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
