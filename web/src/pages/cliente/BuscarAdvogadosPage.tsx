import { useState, useEffect } from 'react';
import { advogadosService, conexoesService } from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { useToast } from '../../components/Toast';

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Vinculados', to: '/minhas-conexoes' },
  { label: 'Minha Conta', to: '/perfil' },
];

const AREAS = [
  { label: 'Todos', icon: '⚖️' },
  { label: 'Criminal', icon: '🔒' },
  { label: 'Trabalhista', icon: '🏭' },
  { label: 'Família', icon: '👨‍👩‍👧' },
  { label: 'Cível', icon: '📋' },
  { label: 'Tributário', icon: '💰' },
  { label: 'Previdenciário', icon: '🛡️' },
];

const PLAN_STYLE: Record<string, { badge: string; ring: string }> = {
  Básico:        { badge: 'bg-slate-100 text-slate-600',   ring: 'ring-slate-200' },
  Profissional:  { badge: 'bg-blue-50 text-blue-700',      ring: 'ring-blue-200' },
  Elite:         { badge: 'bg-amber-50 text-amber-700',    ring: 'ring-amber-300' },
};

const AVATARS = [
  'bg-blue-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-pink-600',
];

export function BuscarAdvogadosPage() {
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState<number | null>(null);
  const [conectados, setConectados] = useState<Set<number>>(new Set());
  const { mostrar } = useToast();

  useEffect(() => {
    setLoading(true);
    const esp = filtro === 'Todos' ? undefined : filtro;
    advogadosService.listar(esp)
      .then(({ data }) => setAdvogados(data))
      .finally(() => setLoading(false));
  }, [filtro]);

  async function conectar(id: number) {
    setConectando(id);
    try {
      await conexoesService.conectar(id);
      setConectados(prev => new Set(prev).add(id));
      mostrar('Solicitação enviada', 'sucesso');
    } catch (e: any) {
      mostrar(e.response?.data?.message ?? 'Erro ao criar vínculo', 'erro');
    } finally {
      setConectando(null);
    }
  }

  const filtrados = advogados.filter(adv =>
    busca === '' ||
    adv.nome.toLowerCase().includes(busca.toLowerCase()) ||
    adv.especializacao.toLowerCase().includes(busca.toLowerCase())
  );

  const areaAtual = AREAS.find(a => a.label === filtro);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      {/* Hero */}
      <div className="bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="max-w-2xl">
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-3">Marketplace Jurídico</p>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
              Encontre o advogado<br />certo para seu caso
            </h1>
            <p className="text-blue-200 text-base mb-8">
              Profissionais verificados, especializados e prontos para te atender com agilidade.
            </p>
            <div className="relative max-w-xl">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Busque por nome ou especialização..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none shadow-xl placeholder-slate-400"
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[
              { n: '200+', label: 'Advogados ativos' },
              { n: '6', label: 'Áreas de atuação' },
              { n: '98%', label: 'Satisfação' },
              { n: '24h', label: 'Resposta média' },
            ].map(({ n, label }) => (
              <div key={label} className="hidden sm:block">
                <p className="text-2xl font-extrabold text-white">{n}</p>
                <p className="text-blue-300 text-xs font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {AREAS.map(({ label, icon }) => (
            <button
              type="button"
              key={label}
              onClick={() => setFiltro(label)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                filtro === label
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
              }`}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Result info */}
        {!loading && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-slate-500 text-sm">
              <span className="font-bold text-slate-800">{filtrados.length}</span>{' '}
              {filtrados.length === 1 ? 'advogado' : 'advogados'}
              {filtro !== 'Todos' && (
                <span> em <span className="font-semibold text-primary">{areaAtual?.icon} {filtro}</span></span>
              )}
            </p>
            {busca && (
              <button type="button" onClick={() => setBusca('')} className="text-xs text-slate-400 hover:text-slate-600 underline">
                Limpar busca
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-28 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-10 bg-slate-100 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-24 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-bold text-slate-700 text-lg">Nenhum resultado</p>
            <p className="text-slate-400 text-sm mt-2">Tente outro filtro ou termo de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtrados.map((adv, i) => {
              const ini = adv.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
              const avatarBg = AVATARS[i % AVATARS.length];
              const planStyle = PLAN_STYLE[adv.plano?.nome] ?? PLAN_STYLE['Básico'];
              const area = AREAS.find(a => a.label === adv.especializacao);
              const isConectado = conectados.has(adv.id);
              const isConectando = conectando === adv.id;

              return (
                <div key={adv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
                  {/* Top strip */}
                  <div className="h-2 bg-gradient-to-r from-primary to-blue-400" />

                  <div className="p-6 flex-1 flex flex-col">
                    {/* Header row */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${avatarBg} flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm`}>
                        {ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 text-base leading-snug">{adv.nome}</h3>
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ring-1 ${planStyle.badge} ${planStyle.ring}`}>
                            {adv.plano?.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full">
                            {area?.icon} {adv.especializacao}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3 mb-4">
                      <span className="font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-slate-500 font-medium">
                        OAB {adv.oab}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        ★★★★★ <span className="text-slate-400 font-normal ml-1">5.0</span>
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {['Atendimento rápido', 'Consulta online', 'Primeira consulta grátis'].map(tag => (
                        <span key={tag} className="text-xs bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => conectar(adv.id)}
                      disabled={isConectando || isConectado}
                      className={`mt-auto w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                        isConectado
                          ? 'bg-emerald-500 text-white cursor-default'
                          : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70'
                      }`}
                    >
                      {isConectando ? 'Solicitando...' : isConectado ? '✓ Contato Solicitado' : 'Solicitar Contato'}
                    </button>
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
