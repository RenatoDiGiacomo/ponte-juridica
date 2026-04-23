import { useState, useEffect } from 'react';
import { advogadosService, conexoesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ESPECIALIZACOES = ['Todos', 'Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];

export function BuscarAdvogadosPage() {
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState<number | null>(null);
  const { logout } = useAuth();

  useEffect(() => {
    setLoading(true);
    const esp = filtro === 'Todos' ? undefined : filtro;
    advogadosService.listar(esp)
      .then(({ data }) => setAdvogados(data))
      .finally(() => setLoading(false));
  }, [filtro]);

  async function conectar(advogadoId: number) {
    setConectando(advogadoId);
    try {
      await conexoesService.conectar(advogadoId);
      alert('Vínculo criado com sucesso!');
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erro ao criar vínculo');
    } finally {
      setConectando(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">Ponte Jurídica</h1>
        <div className="flex gap-4 items-center">
          <a href="/minhas-conexoes" className="text-blue-200 hover:text-white text-sm">Meus Advogados</a>
          <button onClick={logout} className="text-blue-300 hover:text-white text-sm">Sair</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Encontre seu Advogado</h2>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-8">
          {ESPECIALIZACOES.map((esp) => (
            <button
              key={esp}
              onClick={() => setFiltro(esp)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filtro === esp
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-primary'
              }`}
            >
              {esp}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando...</div>
        ) : advogados.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Nenhum advogado encontrado</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advogados.map((adv) => (
              <div key={adv.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold text-lg mr-3 shrink-0">
                    {adv.nome[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{adv.nome}</h3>
                    <p className="text-secondary font-medium text-sm">{adv.especializacao}</p>
                  </div>
                  <span className="text-xs bg-blue-50 text-primary px-2 py-1 rounded-full">
                    {adv.plano?.nome}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">OAB: {adv.oab}</p>
                <button
                  onClick={() => conectar(adv.id)}
                  disabled={conectando === adv.id}
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {conectando === adv.id ? 'Solicitando...' : 'Solicitar Contato'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
