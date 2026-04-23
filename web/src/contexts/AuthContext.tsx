import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';

type Tipo = 'cliente' | 'advogado' | null;

interface AuthContextData {
  token: string | null;
  tipo: Tipo;
  isLoading: boolean;
  loginCliente(email: string, senha: string): Promise<void>;
  loginAdvogado(email: string, senha: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem('@pontejuridica:token'));
    setTipo(localStorage.getItem('@pontejuridica:tipo') as Tipo);
    setIsLoading(false);
  }, []);

  async function loginCliente(email: string, senha: string) {
    const { data } = await authService.loginCliente(email, senha);
    localStorage.setItem('@pontejuridica:token', data.access_token);
    localStorage.setItem('@pontejuridica:tipo', 'cliente');
    setToken(data.access_token);
    setTipo('cliente');
  }

  async function loginAdvogado(email: string, senha: string) {
    const { data } = await authService.loginAdvogado(email, senha);
    localStorage.setItem('@pontejuridica:token', data.access_token);
    localStorage.setItem('@pontejuridica:tipo', 'advogado');
    setToken(data.access_token);
    setTipo('advogado');
  }

  function logout() {
    localStorage.removeItem('@pontejuridica:token');
    localStorage.removeItem('@pontejuridica:tipo');
    setToken(null);
    setTipo(null);
  }

  return (
    <AuthContext.Provider value={{ token, tipo, isLoading, loginCliente, loginAdvogado, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
