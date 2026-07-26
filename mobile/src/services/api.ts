import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Host do backend (sem /api/v1) — usado para montar URL pública de mídia (fotos). */
export const API_HOST = 'http://localhost:3333';
const API_URL = `${API_HOST}/api/v1`;

export const api = axios.create({ baseURL: API_URL });

type ArquivoUpload = { uri: string; name: string; type: string };

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
  porId: (id: number) => api.get(`/advogados/${id}`),
  buscar: (
    params: { area?: string; notaMin?: number; estado?: string; vinculo?: string; page: number; pageSize: number },
    signal?: AbortSignal,
  ) => api.get('/advogados/buscar', { params, signal }),
  meuPerfil: () => api.get('/advogados/perfil'),
  atualizarPerfil: (data: Record<string, string>) => api.patch('/advogados/perfil', data),
  adicionarArea: (areaId: number) => api.post('/advogados/perfil/areas', { areaId }),
  removerArea: (areaId: number) => api.delete(`/advogados/perfil/areas/${areaId}`),
  trocarPlano: (planoId: number) => api.patch('/advogados/perfil/plano', { planoId }),
  dashboard: (ano?: number, mes?: number) =>
    api.get('/advogados/dashboard', { params: { ...(ano && { ano }), ...(mes && { mes }) } }),
};

// Áreas
export const areasService = {
  listar: () => api.get<{ id: number; nome: string }[]>('/areas'),
};

// Clientes
export const clientesService = {
  meuPerfil: () => api.get('/clientes/perfil'),
  atualizarPerfil: (data: Record<string, string>) => api.patch('/clientes/perfil', data),
};

// Planos
export const planosService = {
  listar: () => api.get('/planos'),
};

// Mídia (upload foto/documento) — campo 'arquivo' (multipart)
export const midiaService = {
  enviarFoto: (arquivo: ArquivoUpload) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo as any);
    return api.post('/me/foto', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  enviarDocumento: (arquivo: ArquivoUpload) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo as any);
    return api.post('/me/documento', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Conexões
export const conexoesService = {
  conectar: (advogadoId: number) => api.post(`/conexoes/${advogadoId}`),
  minhas: () => api.get('/conexoes'),
  meusClientes: (params: { busca?: string; page: number; pageSize: number }, signal?: AbortSignal) =>
    api.get('/conexoes/clientes', { params, signal }),
  detalheCliente: (id: number) => api.get(`/conexoes/clientes/${id}`),
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
  encerrar: (processoId: number, justificativa?: string) =>
    api.patch(`/processos/${processoId}/encerrar`, justificativa ? { justificativa } : {}),
  // advogado
  abertos: (
    params: { area?: string; estados?: string; dataDe?: string; dataAte?: string; page?: number; pageSize?: number },
    signal?: AbortSignal,
  ) => api.get('/processos', { params, signal }),
  detalhe: (id: number) => api.get(`/processos/${id}`),
  enviarProposta: (
    processoId: number,
    data: { mensagem: string; valorEstimado: number },
  ) => api.post(`/processos/${processoId}/propostas`, data),
  editarProposta: (propostaId: number, data: { mensagem: string; valorEstimado: number }) =>
    api.patch(`/propostas/${propostaId}`, data),
  cancelarProposta: (propostaId: number, justificativa: string) =>
    api.patch(`/propostas/${propostaId}/cancelar`, { justificativa }),
  quota: () => api.get('/propostas/quota'),
  meusCasosAdvogado: () => api.get('/processos/advogado/meus-casos'),
  adicionarRelatorio: (processoId: number, texto: string) =>
    api.post(`/processos/${processoId}/relatorios`, { texto }),
  editarRelatorio: (relatorioId: number, texto: string) =>
    api.patch(`/relatorios/${relatorioId}`, { texto }),
  removerRelatorio: (relatorioId: number) => api.delete(`/relatorios/${relatorioId}`),
};
