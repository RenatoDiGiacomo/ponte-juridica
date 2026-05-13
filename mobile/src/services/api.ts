import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3333/api/v1';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@pontejuridica:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authService = {
  loginCliente: (email: string, senha: string) =>
    api.post('/auth/cliente/login', { email, senha }),
  loginAdvogado: (email: string, senha: string) =>
    api.post('/auth/advogado/login', { email, senha }),
  registrarCliente: (data: object) => api.post('/auth/cliente/registro', data),
  registrarAdvogado: (data: object) => api.post('/auth/advogado/registro', data),
  me: () => api.get('/auth/me'),
};

// Advogados
export const advogadosService = {
  listar: (especializacao?: string) =>
    api.get('/advogados', { params: especializacao ? { especializacao } : {} }),
  buscar: (id: number) => api.get(`/advogados/${id}`),
  meuPerfil: () => api.get('/advogados/perfil'),
};

// Planos
export const planosService = {
  listar: () => api.get('/planos'),
};

// Conexões
export const conexoesService = {
  conectar: (advogadoId: number) => api.post(`/conexoes/${advogadoId}`),
  minhas: () => api.get('/conexoes'),
  remover: (id: number) => api.delete(`/conexoes/${id}`),
};

// Processos & Propostas
export const processosService = {
  // cliente
  criar: (data: { titulo: string; descricao: string; especializacao: string }) =>
    api.post('/processos', data),
  meus: () => api.get('/processos/meus'),
  pendentes: () => api.get<{ total: number }>('/processos/meus/pendentes'),
  remover: (id: number) => api.delete(`/processos/${id}`),
  aceitarProposta: (propostaId: number) => api.patch(`/propostas/${propostaId}/aceitar`),
  recusarProposta: (propostaId: number) => api.patch(`/propostas/${propostaId}/recusar`),
  // advogado
  abertos: (especializacao?: string) =>
    api.get('/processos', { params: especializacao ? { especializacao } : {} }),
  detalhe: (id: number) => api.get(`/processos/${id}`),
  enviarProposta: (
    processoId: number,
    data: { mensagem: string; valorEstimado: number },
  ) => api.post(`/processos/${processoId}/propostas`, data),
  quota: () => api.get('/propostas/quota'),
};
