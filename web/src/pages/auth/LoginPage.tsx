import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between px-16 py-14">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ponte Jurídica</h1>
          <p className="text-blue-300 mt-2 text-sm">Plataforma de conexão jurídica</p>
        </div>

        <div className="space-y-10">
          <blockquote className="text-white text-2xl font-light leading-relaxed border-l-4 border-white/30 pl-6">
            "Conectando pessoas ao advogado certo, no momento certo."
          </blockquote>
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: '500+', label: 'Advogados' },
              { n: '3k+', label: 'Clientes' },
              { n: '98%', label: 'Satisfação' },
            ].map(({ n, label }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-5 text-center">
                <p className="text-2xl font-bold text-white">{n}</p>
                <p className="text-blue-300 text-xs mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-400 text-xs">© 2026 Ponte Jurídica · MBA Dev Full Stack — Impacta</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Ponte Jurídica</h1>
            <p className="text-gray-500 mt-1 text-sm">Conectando você ao advogado certo</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-10 py-10">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Bem-vindo de volta</h2>
              <p className="text-gray-400 text-sm mt-1">Entre na sua conta para continuar</p>
            </div>

            {/* Tipo toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              {(['cliente', 'advogado'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    tipo === t
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'cliente' ? '👤  Sou Cliente' : '⚖️  Sou Advogado'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 space-y-1.5">
              <p className="text-xs font-bold text-blue-700 mb-2">
                Contas demo · senha: <code className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">senha123</code>
              </p>
              <p className="text-xs text-blue-600">
                Cliente:{' '}
                <button
                  type="button"
                  onClick={() => { setEmail('cliente.demo@pontejuridica.com'); setTipo('cliente'); }}
                  className="underline underline-offset-2 hover:text-blue-800 font-medium"
                >
                  cliente.demo@pontejuridica.com
                </button>
              </p>
              <p className="text-xs text-blue-600">
                Advogado:{' '}
                <button
                  type="button"
                  onClick={() => { setEmail('maria.demo@pontejuridica.com'); setTipo('advogado'); }}
                  className="underline underline-offset-2 hover:text-blue-800 font-medium"
                >
                  maria.demo@pontejuridica.com
                </button>
              </p>
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              Não tem conta?{' '}
              <Link to="/registro" className="text-primary font-semibold hover:underline">
                Cadastre-se grátis
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
