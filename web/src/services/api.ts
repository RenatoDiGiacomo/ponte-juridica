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
};

export const advogadosService = {
  listar: (especializacao?: string) => api.get('/advogados', { params: especializacao ? { especializacao } : {} }),
  buscar: (id: number) => api.get(`/advogados/${id}`),
  meuPerfil: () => api.get('/advogados/perfil'),
};

export const planosService = {
  listar: () => api.get('/planos'),
};

export const conexoesService = {
  conectar: (advogadoId: number) => api.post(`/conexoes/${advogadoId}`),
  minhas: () => api.get('/conexoes'),
  remover: (id: number) => api.delete(`/conexoes/${id}`),
};
