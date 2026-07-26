import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/api';

type Tipo = 'cliente' | 'advogado' | null;

interface AuthContextData {
  token: string | null;
  tipo: Tipo;
  nome: string | null;
  isLoading: boolean;
  loginCliente(email: string, senha: string): Promise<void>;
  loginAdvogado(email: string, senha: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function carregarUsuario() {
    try {
      const { data } = await authService.me();
      setNome(data?.nome ?? null);
    } catch {
      setNome(null);
    }
  }

  useEffect(() => {
    const t = localStorage.getItem('@pontejuridica:token');
    setToken(t);
    setTipo(localStorage.getItem('@pontejuridica:tipo') as Tipo);
    if (t) carregarUsuario();
    setIsLoading(false);
  }, []);

  async function loginCliente(email: string, senha: string) {
    const { data } = await authService.loginCliente(email, senha);
    localStorage.setItem('@pontejuridica:token', data.access_token);
    localStorage.setItem('@pontejuridica:tipo', 'cliente');
    setToken(data.access_token);
    setTipo('cliente');
    await carregarUsuario();
  }

  async function loginAdvogado(email: string, senha: string) {
    const { data } = await authService.loginAdvogado(email, senha);
    localStorage.setItem('@pontejuridica:token', data.access_token);
    localStorage.setItem('@pontejuridica:tipo', 'advogado');
    setToken(data.access_token);
    setTipo('advogado');
    await carregarUsuario();
  }

  function logout() {
    localStorage.removeItem('@pontejuridica:token');
    localStorage.removeItem('@pontejuridica:tipo');
    setToken(null);
    setTipo(null);
    setNome(null);
  }

  return (
    <AuthContext.Provider value={{ token, tipo, nome, isLoading, loginCliente, loginAdvogado, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
