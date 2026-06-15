import axios from 'axios';

export const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@pontejuridica:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  loginCliente: (email: string, senha: string) => api.post('/auth/cliente/login', { email, senha }),
  loginAdvogado: (email: string, senha: string) => api.post('/auth/advogado/login', { email, senha }),
  registrarCliente: (data: object) => api.post('/auth/cliente/registro', data),
  registrarAdvogado: (data: object) => api.post('/auth/advogado/registro', data),
  me: () => api.get('/auth/me'),
};

export const advogadosService = {
  listar: (especializacao?: string) => api.get('/advogados', { params: especializacao ? { especializacao } : {} }),
  buscar: (id: number) => api.get(`/advogados/${id}`),
  meuPerfil: () => api.get('/advogados/perfil'),
  atualizarPerfil: (data: { nome?: string; oab?: string; estadoAtuacao?: string; cidadeAtuacao?: string }) =>
    api.patch('/advogados/perfil', data),
  adicionarArea: (areaId: number) => api.post('/advogados/perfil/areas', { areaId }),
  removerArea: (areaId: number) => api.delete(`/advogados/perfil/areas/${areaId}`),
};

export const areasService = {
  listar: () => api.get<{ id: number; nome: string }[]>('/areas'),
};

export const planosService = {
  listar: () => api.get('/planos'),
};

export const conexoesService = {
  conectar: (advogadoId: number) => api.post(`/conexoes/${advogadoId}`),
  minhas: () => api.get('/conexoes'),
  meusClientes: () => api.get('/conexoes/clientes'),
  remover: (id: number) => api.delete(`/conexoes/${id}`),
};

export const processosService = {
  // cliente
  criar: (data: { titulo: string; descricao: string; especializacao: string }) =>
    api.post('/processos', data),
  meus: () => api.get('/processos/meus'),
  pendentes: () => api.get<{ total: number }>('/processos/meus/pendentes'),
  remover: (id: number) => api.delete(`/processos/${id}`),
  aceitarProposta: (propostaId: number) => api.patch(`/propostas/${propostaId}/aceitar`),
  recusarProposta: (propostaId: number) => api.patch(`/propostas/${propostaId}/recusar`),
  encerrar: (processoId: number) => api.patch(`/processos/${processoId}/encerrar`),
  // advogado
  abertos: (especializacao?: string) =>
    api.get('/processos', { params: especializacao ? { especializacao } : {} }),
  detalhe: (id: number) => api.get(`/processos/${id}`),
  enviarProposta: (
    processoId: number,
    data: { mensagem: string; valorEstimado: number },
  ) => api.post(`/processos/${processoId}/propostas`, data),
  quota: () => api.get<{ plano: string; limite: number | null; usadas: number; restantes: number | null }>('/propostas/quota'),
  meusCasosAdvogado: () => api.get('/processos/advogado/meus-casos'),
  adicionarRelatorio: (processoId: number, texto: string) =>
    api.post(`/processos/${processoId}/relatorios`, { texto }),
};
