import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

type Tipo = 'cliente' | 'advogado' | null;

interface AuthContextData {
  token: string | null;
  tipo: Tipo;
  isLoading: boolean;
  loginCliente: (email: string, senha: string) => Promise<void>;
  loginAdvogado: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const KEY_TOKEN = '@pontejuridica:token';
const KEY_TIPO = '@pontejuridica:tipo';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, tp] = await Promise.all([
          AsyncStorage.getItem(KEY_TOKEN),
          AsyncStorage.getItem(KEY_TIPO),
        ]);
        setToken(t);
        setTipo(tp as Tipo);
      } catch (e) {
        console.warn('AuthContext: falha ao ler storage', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function loginCliente(email: string, senha: string) {
    const { data } = await authService.loginCliente(email, senha);
    await AsyncStorage.setItem(KEY_TOKEN, data.access_token);
    await AsyncStorage.setItem(KEY_TIPO, 'cliente');
    setToken(data.access_token);
    setTipo('cliente');
  }

  async function loginAdvogado(email: string, senha: string) {
    const { data } = await authService.loginAdvogado(email, senha);
    await AsyncStorage.setItem(KEY_TOKEN, data.access_token);
    await AsyncStorage.setItem(KEY_TIPO, 'advogado');
    setToken(data.access_token);
    setTipo('advogado');
  }

  async function logout() {
    await AsyncStorage.removeItem(KEY_TOKEN);
    await AsyncStorage.removeItem(KEY_TIPO);
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
