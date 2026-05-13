import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { processosService } from '../../services/api';
import { Navbar } from '../../components/Navbar';

const NAV = [
  { label: 'Meus Casos', to: '/' },
  { label: 'Encontrar Advogado', to: '/buscar' },
  { label: 'Vinculados', to: '/minhas-conexoes' },
  { label: 'Minha Conta', to: '/perfil' },
];

const AREAS = [
  { label: 'Criminal', icon: '🔒' },
  { label: 'Trabalhista', icon: '🏭' },
  { label: 'Família', icon: '👨‍👩‍👧' },
  { label: 'Cível', icon: '📋' },
  { label: 'Tributário', icon: '💰' },
  { label: 'Previdenciário', icon: '🛡️' },
];

export function CriarCasoPage() {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [area, setArea] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (titulo.trim().length < 5) return setErro('Título precisa ter ao menos 5 caracteres');
    if (descricao.trim().length < 20) return setErro('Descreva o caso com ao menos 20 caracteres');
    if (!area) return setErro('Selecione a área jurídica');

    setSalvando(true);
    try {
      await processosService.criar({ titulo, descricao, especializacao: area });
      navigate('/');
    } catch (e: any) {
      setErro(e.response?.data?.message ?? 'Falha ao publicar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar items={NAV} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 mb-4 inline-block">
          ← Voltar para Meus Casos
        </Link>

        <h1 className="text-3xl font-extrabold text-slate-800 mb-1">Publicar novo caso</h1>
        <p className="text-slate-400 text-sm mb-8">
          Conte sobre seu problema. Apenas advogados especializados na área verão sua publicação.
        </p>

        <form onSubmit={salvar} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Título do caso
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Rescisão indireta por atraso de salário"
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-800 text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-primary transition-colors bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Descreva seu caso
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Conte o que aconteceu, há quanto tempo e quais documentos você tem."
              rows={6}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-800 text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-primary transition-colors bg-slate-50 focus:bg-white resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">{descricao.length} caracteres</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Área jurídica
            </label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setArea(a.label)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    area === a.label
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
              <span>⚠️</span> {erro}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Link
              to="/"
              className="px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
            >
              {salvando ? 'Publicando...' : 'Publicar caso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
