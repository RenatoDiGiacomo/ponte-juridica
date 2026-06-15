/**
 * DTOs de resposta por audiência (privacidade no backend — AR7/D3).
 * Allowlist por construção: campos sensíveis (email/telefone/whatsapp) só existem
 * no DTO da audiência autorizada. Nunca retornar a entidade Prisma crua.
 */

export interface AdvogadoPublicoDTO {
  id: number;
  nome: string;
  oab: string;
  areas: string[];
  nota: number | null;
  estadoAtuacao: string | null;
  cidadeAtuacao: string | null;
  fotoPath: string | null;
  plano?: { id: number; nome: string };
}

export interface AdvogadoContatoDTO extends AdvogadoPublicoDTO {
  email: string;
  telefone: string | null;
  whatsapp: string | null;
}

/** Perfil do próprio advogado (contato + plano completo + contagem de clientes). */
export interface AdvogadoPerfilDTO extends Omit<AdvogadoContatoDTO, 'plano'> {
  assinatura?: string;
  dataCadastro?: string;
  plano: { id: number; nome: string; valorMensal: string; valorAnual: string } | null;
  clientesVinculados: number;
}

// Shape mínimo esperado do Prisma (com `areas: { area: { nome } }` incluído).
type AdvogadoRaw = {
  id: number;
  nome: string;
  oab: string;
  email?: string;
  telefone?: string | null;
  whatsapp?: string | null;
  nota?: unknown;
  estadoAtuacao?: string | null;
  cidadeAtuacao?: string | null;
  fotoPath?: string | null;
  plano?: { id: number; nome: string } | null;
  areas?: { area?: { nome: string } }[];
};

/** Visão pública: SEM email/telefone/whatsapp. Usada em busca/listagem e perfil público. */
export function toAdvogadoPublico(a: AdvogadoRaw): AdvogadoPublicoDTO {
  return {
    id: a.id,
    nome: a.nome,
    oab: a.oab,
    areas: (a.areas ?? []).map((aa) => aa.area?.nome).filter((n): n is string => !!n),
    nota: a.nota != null ? Number(a.nota) : null,
    estadoAtuacao: a.estadoAtuacao ?? null,
    cidadeAtuacao: a.cidadeAtuacao ?? null,
    fotoPath: a.fotoPath ?? null,
    ...(a.plano ? { plano: { id: a.plano.id, nome: a.plano.nome } } : {}),
  };
}

/** Visão de contato: pública + e-mail/telefone/whatsapp. Só para o próprio dono ou clientes vinculados. */
export function toAdvogadoContato(a: AdvogadoRaw): AdvogadoContatoDTO {
  return {
    ...toAdvogadoPublico(a),
    email: a.email ?? '',
    telefone: a.telefone ?? null,
    whatsapp: a.whatsapp ?? null,
  };
}

/** Seleção Prisma padrão que alimenta os DTOs acima (inclui áreas e plano). */
export const SELECT_ADVOGADO_DTO = {
  id: true,
  nome: true,
  oab: true,
  email: true,
  telefone: true,
  whatsapp: true,
  nota: true,
  estadoAtuacao: true,
  cidadeAtuacao: true,
  fotoPath: true,
  assinatura: true,
  dataCadastro: true,
  plano: { select: { id: true, nome: true } },
  areas: { select: { area: { select: { nome: true } } } },
} as const;
