import { useState, useEffect } from 'react';
import { conexoesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function MinhasConexoesPage() {
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<number | null>(null);
  const { logout } = useAuth();

  function carregar() {
    setLoading(true);
    conexoesService.minhas()
      .then(({ data }) => setConexoes(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { carregar(); }, []);

  async function remover(id: number) {
    if (!confirm('Deseja remover este vínculo?')) return;
    setRemovendo(id);
    try {
      await conexoesService.remover(id);
      setConexoes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Erro ao remover vínculo');
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Ponte Jurídica</h1>
        <div className="flex gap-4 items-center">
          <a href="/" className="text-blue-200 hover:text-white text-sm">Buscar Advogados</a>
          <button onClick={logout} className="text-blue-300 hover:text-white text-sm">Sair</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Meus Advogados</h2>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando...</div>
        ) : conexoes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm">
            <p className="text-lg">Nenhum vínculo ainda</p>
            <p className="text-sm mt-2">
              <a href="/" className="text-primary hover:underline">Busque um advogado</a> para solicitar contato
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conexoes.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {c.advogado?.nome?.[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{c.advogado?.nome}</p>
                  <p className="text-secondary text-sm font-medium">{c.advogado?.especializacao}</p>
                  <p className="text-gray-400 text-xs mt-0.5">OAB: {c.advogado?.oab}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gray-300 text-xs mb-2">
                    {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}
                  </p>
                  <button
                    onClick={() => remover(c.id)}
                    disabled={removendo === c.id}
                    className="text-red-400 hover:text-red-600 text-xs font-medium disabled:opacity-50"
                  >
                    {removendo === c.id ? 'Removendo...' : 'Remover'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
