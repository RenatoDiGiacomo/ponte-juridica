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
  solicitarReset: (email: string, tipo: 'cliente' | 'advogado') =>
    api.post<{ enviado: boolean; token?: string }>('/auth/reset/solicitar', { email, tipo }),
  redefinirSenha: (token: string, senha: string) =>
    api.post('/auth/reset/redefinir', { token, senha }),
};

export const avaliacoesService = {
  criar: (data: { processoId: number; nota: number; comentario?: string }) =>
    api.post('/avaliacoes', data),
  porAdvogado: (advogadoId: number) =>
    api.get<{ media: number | null; total: number; avaliacoes: { id: number; nota: number; comentario: string | null; dataCriacao: string; cliente: string }[] }>(`/avaliacoes/advogado/${advogadoId}`),
};

export const notificacoesService = {
  listar: () => api.get<{ id: number; tipo: string; titulo: string; mensagem: string; lida: boolean; dataCriacao: string }[]>('/notificacoes'),
  naoLidas: () => api.get<{ total: number }>('/notificacoes/nao-lidas'),
  marcarLida: (id: number) => api.patch(`/notificacoes/${id}/lida`),
  marcarTodas: () => api.patch('/notificacoes/lidas'),
};

export const advogadosService = {
  porId: (id: number) => api.get(`/advogados/${id}`),
  meuPerfil: () => api.get('/advogados/perfil'),
  pesquisar: (
    params: { busca?: string; area?: string; areas?: string; notaMin?: number; estado?: string; vinculo?: string; page: number; pageSize: number },
    signal?: AbortSignal,
  ) => api.get('/advogados/buscar', { params, signal }),
  atualizarPerfil: (data: { nome?: string; oab?: string; estadoAtuacao?: string; cidadeAtuacao?: string }) =>
    api.patch('/advogados/perfil', data),
  adicionarArea: (areaId: number) => api.post('/advogados/perfil/areas', { areaId }),
  removerArea: (areaId: number) => api.delete(`/advogados/perfil/areas/${areaId}`),
  trocarPlano: (planoId: number) => api.patch('/advogados/perfil/plano', { planoId }),
  dashboard: () => api.get<{
    propostasEnviadas: number; propostasAceitas: number; taxaAceite: number;
    casosAtivos: number; casosEncerrados: number; clientesVinculados: number;
    notaMedia: number | null; totalAvaliacoes: number; faturamentoEstimado: number;
  }>('/advogados/dashboard'),
};

export const areasService = {
  listar: () => api.get<{ id: number; nome: string }[]>('/areas'),
};

export const clientesService = {
  meuPerfil: () => api.get('/clientes/perfil'),
  atualizarPerfil: (data: Record<string, string>) => api.patch('/clientes/perfil', data),
};

export const midiaService = {
  enviarFoto: (arquivo: File) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return api.post('/me/foto', fd);
  },
  enviarDocumento: (arquivo: File) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return api.post('/me/documento', fd);
  },
};

export const planosService = {
  listar: () => api.get('/planos'),
};

export const conexoesService = {
  conectar: (advogadoId: number) => api.post(`/conexoes/${advogadoId}`),
  minhas: () => api.get('/conexoes'),
  meusClientes: (params: { busca?: string; page: number; pageSize: number }, signal?: AbortSignal) =>
    api.get('/conexoes/clientes', { params, signal }),
  detalheCliente: (id: number) => api.get(`/conexoes/clientes/${id}`),
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
  encerrar: (processoId: number, justificativa?: string) =>
    api.patch(`/processos/${processoId}/encerrar`, justificativa ? { justificativa } : {}),
  // advogado
  abertos: (
    params: {
      area?: string;
      areas?: string;
      postadoDias?: number;
      dataDe?: string;
      dataAte?: string;
      estados?: string;
      cidade?: string;
      page: number;
      pageSize: number;
    },
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
  quota: () => api.get<{ plano: string; limite: number | null; usadas: number; restantes: number | null }>('/propostas/quota'),
  meusCasosAdvogado: () => api.get('/processos/advogado/meus-casos'),
  adicionarRelatorio: (processoId: number, texto: string) =>
    api.post(`/processos/${processoId}/relatorios`, { texto }),
  editarRelatorio: (relatorioId: number, texto: string) =>
    api.patch(`/relatorios/${relatorioId}`, { texto }),
  removerRelatorio: (relatorioId: number) => api.delete(`/relatorios/${relatorioId}`),
};
