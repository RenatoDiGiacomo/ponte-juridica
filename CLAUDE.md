# Ponte Jurídica

Marketplace jurídico que conecta clientes (solicitantes) a advogados especializados.
Projeto do MBA Dev Full Stack — Impacta, Grupo 1.

## Equipe

| Nome | Papel |
|------|-------|
| Rafael Mattiuzzo | Dev — back + front + infra |
| Ricardo Matos | Scrum Master |
| Renato Di Giacomo | Product Owner |
| Alexandre Borges | Dev |
| Leandro | Dev — frontend / UX |


## Stack

- **Backend:** NestJS 10 + TypeScript + Prisma ORM
- **Mobile:** React Native + Expo SDK 51 + NativeWind (TailwindCSS)
- **Banco:** MySQL 8 (Docker)
- **Auth:** JWT (access + refresh)
- **Infra:** Docker Compose

## Estrutura do repositório

```
/
├── backend/          # NestJS API
├── mobile/           # React Native (Expo)
├── docker-compose.yml
├── .env.example
└── Documentos/       # docs do MBA
```

## Comandos comuns

```bash
# Subir ambiente completo
docker-compose up -d

# Backend
cd backend && npm run start:dev

# Mobile
cd mobile && npx expo start

# Prisma — gerar migration após mudar schema
cd backend && npx prisma migrate dev --name <descricao>

# Prisma — seed inicial
cd backend && npm run seed
```

## Modelo de dados

| Tabela | Descrição |
|--------|-----------|
| `Plano` | Básico (R$99/mês), Profissional (R$199/mês), Elite (R$399/mês) |
| `Cliente` | Solicitante de serviços jurídicos |
| `Advogado` | OAB + especialização + plano de assinatura |
| `ClienteAdvogado` | Vínculo/processo entre cliente e advogado |

**Regra crítica:** todas as entidades usam `softDelete Boolean @default(false)` — nunca deletar fisicamente.

## Especializações de advogados

Criminal, Trabalhista, Família, Cível, Tributário, Previdenciário

## Planos

| Plano | Mensal | Anual |
|-------|--------|-------|
| Básico | R$ 99,00 | R$ 830,00 |
| Profissional | R$ 199,00 | R$ 1.430,00 |
| Elite | R$ 399,00 | R$ 2.400,00 |

## Módulos da API (NestJS)

- `auth` — login/registro, JWT
- `clientes` — CRUD clientes/solicitantes
- `advogados` — CRUD advogados + OAB + especialização
- `planos` — listagem e gerenciamento de planos
- `conexoes` — vínculo cliente ↔ advogado (processos)

## User Stories planejadas (Sprint 01)

| ID | História | Status |
|----|----------|--------|
| US-01 | Cadastro do Solicitante | Em andamento |
| US-02 | Criação de Post de Processo | Não concluído |
| US-03 | Cadastro do Advogado (com plano) | Em andamento |
| US-04 | Listagem de Processos para Advogado | Não concluído |
| US-05 | Sistema de Taxas da Plataforma | Não concluído |

## Convenções

- Soft delete obrigatório — nunca `DELETE` físico no banco
- Commits em português, Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Branch padrão: `main`. Features em `feat/<nome>`
- API responde sempre em português (mensagens de erro, etc.)
- Endpoints REST: `/api/v1/<recurso>`
