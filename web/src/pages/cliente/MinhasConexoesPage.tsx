import { useState, useEffect } from 'react';
import { conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';

const NAV = [
  { label: 'Encontrar Advogado', to: '/' },
  { label: 'Meus Advogados', to: '/minhas-conexoes' },
];

const ESP_ICONS: Record<string, string> = {
  Criminal: '🔒', Trabalhista: '🏭', Família: '👨‍👩‍👧',
  Cível: '📋', Tributário: '💰', Previdenciário: '🛡️',
};

export function MinhasConexoesPage() {
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState<number | null>(null);

  useEffect(() => {
    conexoesService.minhas()
      .then(({ data }) => setConexoes(data))
      .finally(() => setLoading(false));
  }, []);

  async function remover(id: number) {
    if (!window.confirm('Deseja remover este vínculo?')) return;
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
      <Navbar items={NAV} />

      {/* Hero */}
      <div className="bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-white">Meus Advogados</h1>
          <p className="text-blue-200 mt-1 text-sm">
            {loading ? '...' : `${conexoes.length} ${conexoes.length === 1 ? 'advogado vinculado' : 'advogados vinculados'}`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Carregando...</p>
          </div>
        ) : conexoes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-24 text-center">
            <div className="text-5xl mb-4">⚖️</div>
            <p className="font-semibold text-gray-700 text-lg">Nenhum advogado vinculado</p>
            <p className="text-gray-400 text-sm mt-2 mb-6">Solicite contato com um advogado para ele aparecer aqui</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              🔍 Buscar Advogados
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {conexoes.map((c, i) => {
              const adv = c.advogado;
              const ini = adv?.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? '?';
              const colors = ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-green-500 to-green-700', 'from-amber-500 to-amber-700'];
              const grad = colors[i % colors.length];
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`bg-gradient-to-br ${grad} px-6 pt-6 pb-5`}>
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
                        {ini}
                      </div>
                      <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                        {adv?.plano?.nome ?? 'Básico'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-bold text-white text-base">{adv?.nome}</h3>
                      <p className="text-white/70 text-xs mt-0.5">
                        {ESP_ICONS[adv?.especializacao] ?? '⚖️'} {adv?.especializacao}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg text-xs text-gray-500">
                        OAB {adv?.oab}
                      </span>
                      <span className="text-gray-400 text-xs">
                        desde {new Date(c.dataVinculo).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <a
                        href={`mailto:${adv?.email}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
                      >
                        ✉️ Contato
                      </a>
                      <button
                        type="button"
                        onClick={() => remover(c.id)}
                        disabled={removendo === c.id}
                        className="px-3 py-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        title="Remover vínculo"
                      >
                        {removendo === c.id ? '...' : '🗑️'}
                      </button>
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
