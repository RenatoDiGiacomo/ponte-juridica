import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, planosService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ESPECIALIZACOES = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];

export function RegistroPage() {
  const [tipo, setTipo] = useState<'cliente' | 'advogado'>('cliente');
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const { loginCliente, loginAdvogado } = useAuth();
  const navigate = useNavigate();

  // Cliente fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');

  // Advogado extra fields
  const [oab, setOab] = useState('');
  const [especializacao, setEspecializacao] = useState('');
  const [planoId, setPlanoId] = useState<number | null>(null);

  useEffect(() => {
    if (tipo === 'advogado') {
      planosService.listar().then(({ data }) => setPlanos(data));
    }
  }, [tipo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha !== confirmar) { setErro('As senhas não conferem'); return; }
    if (tipo === 'advogado' && !especializacao) { setErro('Selecione uma especialização'); return; }
    if (tipo === 'advogado' && !planoId) { setErro('Selecione um plano'); return; }
    setLoading(true);
    try {
      if (tipo === 'cliente') {
        await authService.registrarCliente({ nome, email, documento, senha });
        await loginCliente(email, senha);
      } else {
        await authService.registrarAdvogado({ nome, email, oab, area: especializacao, planoId, senha });
        await loginAdvogado(email, senha);
      }
      navigate('/');
    } catch (e: any) {
      setErro(e.response?.data?.message ?? 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Ponte Jurídica</h1>
          <p className="text-gray-500 mt-2">Crie sua conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Tipo selector */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['cliente', 'advogado'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tipo === t ? 'bg-white text-primary shadow' : 'text-gray-500'
                }`}
              >
                {t === 'cliente' ? 'Sou Cliente' : 'Sou Advogado'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="Seu nome" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="seu@email.com" required
              />
            </div>

            {tipo === 'cliente' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  value={documento} onChange={(e) => setDocumento(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="000.000.000-00" required
                />
              </div>
            )}

            {tipo === 'advogado' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OAB</label>
                  <input
                    value={oab} onChange={(e) => setOab(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="SP123456" required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialização</label>
                  <div className="flex flex-wrap gap-2">
                    {ESPECIALIZACOES.map((esp) => (
                      <button
                        key={esp} type="button"
                        onClick={() => setEspecializacao(esp)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          especializacao === esp
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {esp}
                      </button>
                    ))}
                  </div>
                </div>

                {planos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plano</label>
                    <div className="space-y-2">
                      {planos.map((p) => (
                        <button
                          key={p.id} type="button"
                          onClick={() => setPlanoId(p.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            planoId === p.id
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <span className="font-semibold text-gray-800">{p.nome}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            R$ {Number(p.valorMensal).toFixed(2)}/mês
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="••••••" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="••••••" required
              />
            </div>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
