import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type DemoUser = {
  label: string;
  email: string;
  tipo: 'cliente' | 'advogado';
  hint: string;
  icon: string;
};

const DEMO_USERS: DemoUser[] = [
  { label: 'João Silva', tipo: 'cliente', email: 'cliente.demo@pontejuridica.com', icon: '👤', hint: 'Caso em atendimento + propostas pendentes' },
  { label: 'Mariana Souza', tipo: 'cliente', email: 'mariana@pontejuridica.com', icon: '👤', hint: 'Caso de Família com proposta' },
  { label: 'Dra. Maria Ferreira', tipo: 'advogado', email: 'maria.demo@pontejuridica.com', icon: '⚖️', hint: 'Trabalhista · plano Profissional (20/mês)' },
  { label: 'Dra. Juliana Costa', tipo: 'advogado', email: 'juliana@pontejuridica.com', icon: '⚖️', hint: 'Cível · plano Básico (5/mês)' },
  { label: 'Dr. Carlos Mendes', tipo: 'advogado', email: 'carlos@pontejuridica.com', icon: '⚖️', hint: 'Criminal · plano Elite (ilimitado)' },
];

const SENHA_DEMO = 'senha123';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState<'cliente' | 'advogado'>('cliente');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { loginCliente, loginAdvogado } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      if (tipo === 'cliente') await loginCliente(email, senha);
      else await loginAdvogado(email, senha);
      navigate('/');
    } catch {
      setErro('E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  function preencherDemo(u: DemoUser) {
    setEmail(u.email);
    setSenha(SENHA_DEMO);
    setTipo(u.tipo);
    setErro('');
  }

  async function entrarComoDemo(u: DemoUser) {
    setEmail(u.email);
    setSenha(SENHA_DEMO);
    setTipo(u.tipo);
    setErro('');
    setLoading(true);
    try {
      if (u.tipo === 'cliente') await loginCliente(u.email, SENHA_DEMO);
      else await loginAdvogado(u.email, SENHA_DEMO);
      navigate('/');
    } catch {
      setErro('Não foi possível entrar como demo. O backend está rodando?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT ── Hero */}
      <div className="relative flex-1 bg-primary flex flex-col overflow-hidden min-h-[40vh] lg:min-h-screen">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,_rgba(41,98,156,0.6),_transparent)]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col justify-between h-full px-10 py-12 lg:px-16 lg:py-16">
          {/* Logo */}
          <div>
            <div className="bg-white rounded-2xl px-6 py-4 inline-block shadow-xl">
              <img src="/logo-full.png" alt="Ponte Jurídica" className="h-12 w-auto" />
            </div>
          </div>

          {/* Main copy */}
          <div className="my-auto py-12">
            <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-4">Marketplace Jurídico</p>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-6">
              Conectando<br />
              <span className="text-secondary">pessoas</span> ao<br />
              advogado certo
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              A plataforma que une clientes e advogados de forma rápida, transparente e segura.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {[
                { n: '200+', label: 'Advogados' },
                { n: '6', label: 'Especialidades' },
                { n: '98%', label: 'Satisfação' },
              ].map(({ n, label }) => (
                <div key={label}>
                  <p className="text-3xl font-extrabold text-white">{n}</p>
                  <p className="text-blue-300 text-xs font-semibold mt-0.5 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom credits */}
          <div>
            <p className="text-blue-400 text-xs mb-2">© 2026 Ponte Jurídica · MBA Dev Full Stack — Impacta</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {[
                'Alexandre Brito Borges',
                'Rafael Augusto Mattiuzzo',
                'Renato Di Giacomo',
                'Ricardo Soares Matos',
                'Thomás Réa Farias',
              ].map(nome => (
                <span key={nome} className="text-blue-500/70 text-xs font-medium">{nome}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT ── Form */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex items-center justify-center bg-white px-8 py-12 lg:py-0">
        <div className="w-full max-w-sm">

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-800">Bem-vindo de volta</h2>
            <p className="text-slate-400 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          {/* Tipo */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-7">
            {(['cliente', 'advogado'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  tipo === t ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'cliente' ? '👤  Cliente' : '⚖️  Advogado'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com"
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-800 text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-primary transition-colors bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                placeholder="••••••••"
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-3.5 text-slate-800 text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-primary transition-colors bg-slate-50 focus:bg-white"
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                <span>⚠️</span> {erro}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-primary/20 mt-2"
            >
              {loading ? 'Entrando...' : `Entrar como ${tipo === 'cliente' ? 'Cliente' : 'Advogado'}`}
            </button>
          </form>

          {/* Demo box */}
          <div className="mt-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Acesso r&aacute;pido demo
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Clique no card para entrar direto. Senha: <code className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">senha123</code>
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <div
                  key={u.email}
                  className="flex items-stretch bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary/50 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => entrarComoDemo(u)}
                    disabled={loading}
                    className="flex-1 text-left flex items-center gap-3 px-3 py-2.5 hover:bg-primary/5 group"
                  >
                    <span className="text-lg">{u.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-700 group-hover:text-primary truncate">
                          {u.label}
                        </p>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          u.tipo === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.tipo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{u.hint}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => preencherDemo(u)}
                    disabled={loading}
                    title="Apenas preencher os campos"
                    className="px-3 border-l border-slate-200 text-slate-400 hover:text-primary hover:bg-slate-50"
                  >
                    ✎
                  </button>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Não tem conta?{' '}
            <Link to="/registro" className="text-primary font-bold hover:underline">
              Cadastre-se grátis →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
