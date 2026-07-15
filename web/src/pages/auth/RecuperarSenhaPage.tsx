import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

export function RecuperarSenhaPage() {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [tipo, setTipo] = useState<'cliente' | 'advogado'>('cliente');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const navigate = useNavigate();

  async function solicitar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setAviso('');
    setLoading(true);
    try {
      const { data } = await authService.solicitarReset(email, tipo);
      // Modo demo: sem SMTP, o backend devolve o token para concluir o fluxo.
      if (data.token) {
        setToken(data.token);
        setAviso('Modo demonstração: como não há envio de e-mail configurado, use o código já preenchido abaixo para redefinir sua senha.');
      } else {
        setAviso('Se o e-mail existir, enviamos um código de redefinição. Informe-o abaixo.');
      }
      setPasso(2);
    } catch {
      setErro('Não foi possível processar a solicitação.');
    } finally {
      setLoading(false);
    }
  }

  async function redefinir(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (senha.length < 6) return setErro('A senha deve ter no mínimo 6 caracteres');
    if (senha !== confirmar) return setErro('As senhas não conferem');
    setLoading(true);
    try {
      await authService.redefinirSenha(token, senha);
      navigate('/login', { replace: true });
    } catch (e: any) {
      setErro(e.response?.data?.message ?? 'Token inválido ou expirado');
    } finally {
      setLoading(false);
    }
  }

  const INP = 'w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:border-primary focus:bg-white focus:outline-none';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-primary">Recuperar senha</h1>
          <p className="mt-1 text-sm text-slate-400">
            {passo === 1 ? 'Informe seu e-mail para redefinir a senha' : 'Defina sua nova senha'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          {aviso && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{aviso}</p>}
          {erro && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">⚠️ {erro}</p>}

          {passo === 1 ? (
            <form onSubmit={solicitar} className="space-y-4">
              <div className="flex rounded-2xl bg-slate-100 p-1">
                {(['cliente', 'advogado'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTipo(t)} className={`flex-1 rounded-xl py-2 text-sm font-bold ${tipo === t ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}>
                    {t === 'cliente' ? 'Cliente' : 'Advogado'}
                  </button>
                ))}
              </div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={INP} />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={redefinir} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Código</label>
                <input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Código recebido" className={`${INP} font-mono`} />
              </div>
              <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Nova senha (mín. 6)" className={INP} />
              <input type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} placeholder="Confirmar nova senha" className={INP} />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {loading ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            <Link to="/login" className="font-bold text-primary hover:underline">← Voltar ao login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
