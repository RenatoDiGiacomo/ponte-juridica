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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Tipo>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['@pontejuridica:token', '@pontejuridica:tipo']).then(
      ([t, tp]) => {
        setToken(t[1]);
        setTipo(tp[1] as Tipo);
        setIsLoading(false);
      },
    );
  }, []);

  async function loginCliente(email: string, senha: string) {
    const { data } = await authService.loginCliente(email, senha);
    await AsyncStorage.multiSet([
      ['@pontejuridica:token', data.access_token],
      ['@pontejuridica:tipo', 'cliente'],
    ]);
    setToken(data.access_token);
    setTipo('cliente');
  }

  async function loginAdvogado(email: string, senha: string) {
    const { data } = await authService.loginAdvogado(email, senha);
    await AsyncStorage.multiSet([
      ['@pontejuridica:token', data.access_token],
      ['@pontejuridica:tipo', 'advogado'],
    ]);
    setToken(data.access_token);
    setTipo('advogado');
  }

  async function logout() {
    await AsyncStorage.multiRemove(['@pontejuridica:token', '@pontejuridica:tipo']);
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
