---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-14'
inputDocuments:
  - 'docs/bmad/prd.md'
  - 'docs/bmad/ux-design-specification.md'
  - 'backend/prisma/schema.prisma'
  - 'CLAUDE.md'
workflowType: 'architecture'
project_name: 'Ponte Jurídica'
user_name: 'Rafael Mattiuzzo'
date: '2026-06-12'
projectContext: 'brownfield'
---

# Architecture Decision Document - Ponte Jurídica

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview
**Functional Requirements (35 FRs):** concentram-se em 4 eixos arquiteturais:
1. **Modelagem de dados:** N:N de áreas de atuação (FR1-2), campos ricos de perfil (FR4-6), nota seedada.
2. **Listagem filtrada/paginada server-side:** casos, oportunidades, advogados, clientes (FR8-15, 19-25, 31).
3. **Storage e acesso a mídia:** foto pública vs. documento privado (FR5-6, 30).
4. **Máquina de estados + regras de negócio:** transição de status do caso (FR26-27), cota e troca de plano (FR28-31).

**Non-Functional Requirements (14 NFRs):**
- **Privacidade no backend (NFR1-4) — cross-cutting dominante:** serialização condicional (allowlist público/privado), escopo de vínculo para contatos, documento por endpoint autenticado.
- **Upload seguro (NFR5):** validação de tipo/tamanho.
- **Performance/paginação (NFR6-8):** filtro e ordenação no servidor; envelope único; sem download do conjunto completo.
- **Qualidade de entrega (NFR12-14):** builds limpos, seed reexecutável, zero confirm/alert.

### Scale & Complexity
- Primary domain: full-stack web (NestJS + React).
- Complexity level: **média** (sem real-time, multi-tenancy, integrações externas ou compliance certificada).
- **Sem real-time:** refetch sob demanda basta — nenhum WebSocket/subscription.
- Componentes arquiteturais estimados: ~6 módulos de backend afetados (advogados, clientes, processos, propostas, planos, + novo módulo de mídia/upload) + camada transversal de paginação e privacidade.

### Technical Constraints & Dependencies
- **Brownfield:** stack fixa — NestJS 11 + Prisma 5 + MySQL; React + Vite + Tailwind v4; Docker (MySQL+Adminer).
- **Sem dependências novas pesadas:** sem WebSocket, sem storage em nuvem, sem gateway de pagamento.
- **Risco-âncora — migração N:N é migração de DADOS faseada (expand-contract), não só DDL:** (1) adicionar tabela `Area` + join `AdvogadoArea`, mantendo `especializacao` na tabela; (2) migration de dados popula o join a partir da string antiga; (3) só depois — em migration separada, após o código parar de ler `especializacao` — remover a coluna. **Nunca big-bang.** Preservar `especializacao` antiga até a migração ser validada.
- **Áreas = lista controlada/seedada, não texto livre:** vocabulário fixo dos 6 valores já usados no front (Criminal, Trabalhista, Família, Cível, Tributário, Previdenciário). Texto livre quebraria o matching/filtro por área (FR9-11, FR19-20).

### Cross-Cutting Concerns Identified
1. **Privacidade/serialização condicional** — afeta todo endpoint que devolve Cliente/Advogado.
2. **Paginação + filtro server-side** — padrão único (envelope `{data,total,page,pageSize}` + querystring) reutilizado em 4+ telas.
3. **Upload/storage de mídia** — público vs. privado, validação, servir arquivo.
4. **Autorização por papel/propriedade** — quem vê o quê, quem pode encerrar/aceitar (JWT cliente vs. advogado já existente).
5. **Máquina de estados do caso** — transições válidas e quem as dispara.

## Starter Template Evaluation

### Primary Technology Domain
Full-stack web — **projeto brownfield existente**, sem seleção de starter. A stack está estabelecida e operacional; introduzir um starter seria reescrita injustificada.

### Baseline existente (a manter)
- **Backend:** NestJS 11 + Prisma 5 (ORM) + MySQL 8. Porta 3333. Auth JWT separado por tipo (cliente/advogado).
- **Web:** React + Vite + Tailwind CSS v4. Porta 5173. Sem biblioteca de UI (componentes próprios).
- **Infra dev:** Docker Compose (MySQL + Adminer porta 8080).
- **Organização:** backend por módulos NestJS (advogados, clientes, conexoes, planos, processos, auth, prisma, common); web por páginas (cliente/, advogado/, auth/), components/, contexts/, hooks/, services/.

### Decisões já fixadas pela baseline
- TypeScript em todo o stack. Prisma + MySQL (**fixar Prisma ^5** — Prisma 7 quebra com NestJS clássico). Tailwind v4 com tokens `@theme`. Front: fetch + refetch sob demanda (sem state manager global).

### Dependências já presentes (verificado em backend/package.json)
- **Validação:** class-validator ^0.15.1 + class-transformer ^0.5.1; `ValidationPipe({ whitelist:true, transform:true })` já global no main.ts (filtra input não-declarado nos DTOs).
- **Upload:** multer via @nestjs/platform-express (`FileInterceptor`) — sem dependência nova.
- **Auth:** @nestjs/jwt, passport-jwt, bcryptjs.

### Únicas adições candidatas (decididas no passo 4)
- **Servir foto pública:** `@nestjs/serve-static` (NÃO instalado) OU endpoint de controller.
- **Serialização de saída p/ privacidade:** `ClassSerializerInterceptor` + `@Exclude/@Expose` (class-transformer já presente) OU DTOs de resposta explícitos.

**Nota:** não há story de inicialização — o projeto já roda. A primeira story técnica é a fundação de schema (N:N de áreas), não bootstrap.

## Core Architectural Decisions

### Decision Priority Analysis
**Críticas (bloqueiam implementação):** modelagem N:N de áreas + campos novos; mecanismo de privacidade; contrato de paginação; storage de mídia.
**Importantes (moldam a arquitetura):** máquina de estados do caso; cálculo de cota; troca de plano.
**Diferidas (pós-MVP):** cache, cripto em repouso, avaliações reais.

### Data Architecture

**D1 — Schema N:N de áreas + campos ricos (migração expand-contract):**
Novos models Prisma:
```
model Area {                       // lista controlada, seedada
  id        Int            @id @default(autoincrement())
  nome      String         @unique @db.VarChar(50)   // Criminal, Trabalhista, ...
  advogados AdvogadoArea[]
}
model AdvogadoArea {               // join N:N
  advogadoId Int
  areaId     Int
  advogado   Advogado @relation(...)
  area       Area     @relation(...)
  @@id([advogadoId, areaId])
}
```
Campos novos:
- **Advogado:** `nota Decimal? @db.Decimal(2,1)` (seedada, ex.: 4.8), `estadoAtuacao`, `cidadeAtuacao`, `telefone`, `whatsapp`, `fotoPath`. Mantém `especializacao` (legado) até a contração.
- **Cliente:** `fotoPath`, `dataNascimento` (idade derivada — não armazenar idade), `enderecoLogradouro/…`, `telefone`, `documentoPath` (privado).
- **Processo:** `estado`, `cidade` — **herdados do cliente ao publicar, com opção de ajustar** (resolve filtro de região das oportunidades, FR20). `relatorioAtual` removido em favor da tabela abaixo.

Novo model para relatório de situação (FR24/A1) — **histórico, não campo único**:
```
model RelatorioCaso {
  id         Int      @id @default(autoincrement())
  processoId Int      @map("id_processo")
  advogadoId Int      @map("id_advogado")   // quem registrou
  texto      String   @db.Text
  dataCriacao DateTime @default(now()) @map("data_criacao")
  softDelete Boolean  @default(false) @map("soft_delete")
  processo   Processo @relation(...)
  advogado   Advogado @relation(...)
  @@map("relatorio_caso")
}
```
O advogado registra entradas de relatório ao longo do atendimento; o detalhe do caso mostra o histórico (mais recente no topo).

**Migração faseada (expand-contract):** (1) add Area/AdvogadoArea/campos; (2) seed das 6 áreas + script que mapeia `especializacao` → AdvogadoArea; (3) migration separada remove `especializacao` após o código migrar.

**D2 — Validação:** DTOs com class-validator (já global, whitelist). Query DTOs para filtros/paginação.

### Authentication & Security

**D3 — Privacidade por DTO de resposta explícito (decisão dominante):**
Todo endpoint que retorna Cliente/Advogado passa por um mapper que monta o DTO conforme a audiência:
- `AdvogadoPublicoDTO` (busca/listagem): nome, áreas, nota, estado, foto — **sem** telefone/whatsapp/email.
- `AdvogadoContatoDTO` (só para clientes vinculados): + email, telefone, whatsapp.
- `ClientePerfilDTO` (só o próprio dono): todos os campos, inclusive privados.
- `ClientePublicoDTO`: nada de endereço/telefones.
Allowlist por construção: campo sensível só existe no DTO da audiência certa. Verificável no DevTools.
*(Alternativa preterida: ClassSerializerInterceptor + @Expose groups — mais elegante, menos óbvio de auditar.)*

**D4 — Autorização por papel/propriedade:** guards JWT existentes (cliente/advogado) + checagens de propriedade: contatos exigem vínculo ClienteAdvogado; documento privado exige `dono === req.user`.

### API & Communication Patterns

**D5 — Contrato de paginação único:** `PaginatedDTO<T> = { data: T[], total, page, pageSize }`.
- `PaginationQueryDto` compartilhado (page default 1, pageSize default 20, validado). Filtros via querystring tipada por tela. Filtro/ordenação **sempre no Prisma** (where/orderBy/skip/take), nunca em memória.
- REST mantido (sem GraphQL). Erros no padrão Nest (exception filters existentes).

**D6 — Storage de mídia (filesystem):**
- Layout: `uploads/fotos/{id}.ext` (público) e `uploads/documentos/{id}.ext` (privado). Path persistido no DB.
- **Foto pública:** servida via `@nestjs/serve-static` (adicionar dep) montado em `/uploads/fotos`.
- **Documento privado:** nunca estático — endpoint `GET /me/documento` autenticado que faz stream só se `dono === req.user`; terceiro → 403.
- Upload: `FileInterceptor` (multer) com `fileFilter` (jpg/png/pdf) + `limits.fileSize` 5MB; erro → 400 com mensagem.

### Frontend Architecture
- Sem state manager global; hook `usePaginatedQuery` consome o envelope `{data,total,page,pageSize}`. Refetch após mutação. Componentes próprios (Modal sobre `<dialog>`, etc.).

### Domain Logic

**D7 — Máquina de estados do caso (ProcessoStatus):** transições válidas centralizadas num service.
- `aberto → em_atendimento`: automático ao aceitar proposta (em **transação**).
- **Auto-recusa das demais propostas ao aceitar: CONFIGURÁVEL** (decisão do PO). Não chumbar — flag de
  configuração do backend (`AUTO_RECUSAR_PROPOSTAS_AO_ACEITAR`, default: **true** = recusa as demais).
  Pode evoluir para setting persistido se necessário. A transação respeita a flag.
- `* → encerrado`: disparado por cliente dono OU advogado responsável (guard de propriedade).
- Transições inválidas rejeitadas (ex.: encerrado → aberto).

**D8 — Cota de propostas:** **calculada, não armazenada** — `propostasRestantes = plano.limite − count(Proposta where advogadoId + mês corrente)`. Evita contador dessincronizado.

**D9 — Troca de plano:** `PATCH /advogado/plano` atualiza `planoId`; a cota recalcula automaticamente (D8) com o novo limite. Sem cobrança (fora de escopo).

**D10 — Nota do advogado:** `Decimal(2,1)` (0.0–5.0, ex.: 4.8), seedada nesta rodada. Read-only no app.

### Decision Impact Analysis
**Sequência de implementação:** D1 (schema/migração) → D3/D6 (privacidade+storage) → D5 (paginação) → D7/D8/D9 (regras) → front. Alinha com as Ondas 0→3 do PRD.
**Dependências:** filtros (D5) dependem do N:N (D1); contatos (D3) dependem de vínculo; cota (D8) e plano (D9) acoplados.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined
Padrões derivados do código existente (brownfield) — agentes de dev DEVEM seguir o que já está no repositório, não introduzir estilos novos.

### Naming Patterns

**Database (Prisma):**
- Campos do model em **camelCase**; mapeados para coluna **snake_case** via `@map` (ex.: `valorEstimado @map("valor_estimado")`).
- Tabela via `@@map` em **snake_case** (atenção a nomes legados: Advogado → `adv`, vínculo → `cliente_advogado`).
- Novos: model `Area` → `@@map("area")`; join `AdvogadoArea` → `@@map("advogado_area")`, PK composta `@@id([advogadoId, areaId])`.
- **Soft delete:** entidades de domínio (Cliente, Advogado, Processo, Proposta) mantêm `softDelete Boolean @default(false)` como hoje. **`Area` e `AdvogadoArea` NÃO usam softDelete — hard delete.** Soft delete em join N:N é anti-padrão (acumula lixo e quebra a PK composta ao readicionar a mesma área); lista controlada não se deleta.

**API:**
- Prefixo **`/api/v1`** (já no `@Controller('api/v1')`). Recursos no **plural** (`processos`, `advogados`).
- Param de rota `:id` com **`ParseIntPipe`**. Query params em camelCase.
- Todo endpoint anotado com **Swagger** (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, `@ApiQuery`).

**Código (PT-BR no domínio):**
- Métodos/variáveis em **português** seguindo o existente (`criar`, `meusProcessos`, `contarPropostasPendentes`).
- DTOs: `VerboSubstantivoDto` (`CriarProcessoDto`); arquivo kebab-case (`criar-processo.dto.ts`).
- Services `XxxService` (PascalCase); injetados com nome curto (`private processos`).
- Componentes React PascalCase (`MeusCasosPage.tsx`); páginas em `pages/<papel>/`; serviços em `services/`.

### Format Patterns

**Respostas de API:**
- **Recurso único / objeto:** retorno direto (sem wrapper), como já é hoje.
- **Listagem paginada (NOVO):** envelope único `{ data: T[], total, page, pageSize }` — para casos, oportunidades, advogados, clientes. Não envelopar o que não é lista.
- **Contadores/ações pontuais:** objeto direto pequeno (`{ total }`), padrão já existente.
- **Datas:** ISO 8601 string. JSON sempre **camelCase**.

**Privacidade (regra dura):**
- **NUNCA** retornar entidade Prisma crua de Cliente/Advogado. Sempre via DTO/mapper de resposta por audiência (`AdvogadoPublicoDTO` / `AdvogadoContatoDTO` / `ClientePerfilDTO`). Campo sensível só existe no DTO da audiência certa.

**Query (regra dura):**
- Toda query de listagem **começa** filtrando `softDelete: false` da entidade-alvo, **antes** dos filtros de negócio — inclusive quando faz JOIN em `advogado_area`. Ex.: "advogados da área X" = `Advogado where { softDelete:false, areas: { some: { areaId } } }`.

### Process Patterns

**Autorização:**
- Guard `JwtAuthGuard` + decorator `@UsuarioAtual()` (tipo `Usuario = { id, tipo: 'cliente'|'advogado' }`).
- Checagem de papel via helpers `exigirCliente(u)` / `exigirAdvogado(u)` → `ForbiddenException`.
- Checagem de propriedade (dono do recurso, vínculo) no service → `ForbiddenException`/`NotFoundException`.

**Erros:**
- Exceções nativas do Nest (`ForbiddenException`, `BadRequestException`, `NotFoundException`) com **mensagem em PT-BR**. Front nunca usa `alert()`/`confirm()` (NFR14).

**Validação:**
- DTOs de entrada com class-validator + mensagens PT-BR + `@ApiProperty`. ValidationPipe global já filtra (whitelist).
- Upload validado no interceptor (tipo/tamanho), erro → `BadRequestException` PT-BR.

**Transações:**
- Operações multi-passo (aceitar proposta → mudar status + recusar demais conforme flag configurável) usam `prisma.$transaction`. Regras de transição de status centralizadas no service do processo.

### Frontend Patterns
- Camada `services/` por domínio (ex.: `processosService.meus()`); refetch após mutação.
- Estado de loading/erro local por tela; skeleton no master-detail (não spinner central).
- Hook compartilhado `usePaginatedQuery` consumindo o envelope `{data,total,page,pageSize}`.

### Enforcement Guidelines
**Todo agente de dev DEVE:** seguir PT-BR no domínio; usar `/api/v1` + plural + Swagger; paginar com o envelope único; nunca retornar entidade crua de Cliente/Advogado (privacidade via DTO); usar os helpers de papel/propriedade existentes; manter `softDelete` nas entidades de domínio mas **não** nos joins/lookup; toda listagem começa com `softDelete:false` da entidade-alvo.
**Anti-padrões:** inglês no domínio; retorno cru de entidade com dado privado; filtro/paginação em memória; `alert/confirm`; soft delete em join N:N; envelope inconsistente entre endpoints de lista.

## Project Structure & Boundaries

### Estrutura atual (mantida) + adições deste lote
```
backend/
├── prisma/
│   ├── schema.prisma          # + models Area, AdvogadoArea; + campos Advogado/Cliente
│   ├── migrations/            # + migrations expand-contract (3 passos)
│   └── seed.ts                # + seed das 6 áreas; mapear especializacao->AdvogadoArea
├── src/
│   ├── main.ts                # + ServeStaticModule p/ /uploads/fotos
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/        # @UsuarioAtual (existe)
│   │   ├── guards/            # JwtAuthGuard (existe)
│   │   ├── dto/               # + PaginationQueryDto, PaginatedDTO<T> (NOVO, compartilhado)
│   │   └── upload/            # + util de upload (fileFilter jpg/png/pdf + 5MB) (NOVO)
│   ├── advogados/             # + areas, perfil rico, filtros, DTOs por audiencia, troca de plano
│   ├── clientes/              # + perfil rico, privacidade, contatos de vinculados
│   ├── conexoes/              # (vinculo — base do escopo de contatos)
│   ├── processos/             # + filtros/paginacao, maquina de estados, encerrar
│   ├── planos/                # (cota calculada usa plano)
│   ├── areas/                 # + NOVO modulo: listar areas (lookup)
│   ├── midia/                 # + NOVO modulo: upload + servir documento privado
│   ├── auth/
│   └── prisma/
└── uploads/                   # + NOVO: fotos/ (publico) e documentos/ (privado)

web/src/
├── components/                # + Modal, FormField, FilterBar/Chips, Pagination,
│                              #   StatusBadge, RatingStars, ProposalCard, EmptyState,
│                              #   Avatar, FileUpload, Toast, Skeleton (ver UX)
├── hooks/                     # + usePaginatedQuery, useDebounce
├── contexts/                  # (auth existente)
├── pages/
│   ├── cliente/               # MeusCasos (master-detail C2), BuscarAdvogados (C4),
│   │                          #   MinhasConexoes (C5), PerfilCliente (C6)
│   ├── advogado/              # Oportunidades (A3/A4), MeusClientes (A5),
│   │                          #   PerfilAdvogado (A6), + NOVA: MeusCasosAdvogado (A1)
│   └── auth/
└── services/                  # + metodos de filtro/paginacao por dominio
```

### Architectural Boundaries
- **API boundary:** todos os endpoints sob `/api/v1`, autenticados por `JwtAuthGuard`; estáticos de foto em `/uploads/fotos`; documento privado só via `GET /api/v1/midia/documento` autenticado.
- **Module boundary:** cada domínio é um módulo Nest isolado (controller + service + dto/). `midia` e `areas` são novos módulos próprios (responsabilidade clara); `common/` concentra o transversal (paginação, upload, guards, decorators).
- **Data boundary:** acesso só via PrismaService; nenhuma query crua fora dos services; DTO de resposta sempre na fronteira do controller (privacidade).
- **Frontend boundary:** páginas consomem `services/` (nunca axios direto na página); componentes "burros" recebem props; estado local por tela.

### Requirements → Structure Mapping (por Onda)
- **Onda 0 (fundação):** `prisma/` (schema+migrations+seed), `common/dto` (paginação), `common/upload`, `midia/`, `areas/`, componentes `Modal`/`FormField`/`FileUpload`, hooks.
- **Onda 1 (núcleo C2/A1/C3/A6):** `processos/` (estados), `pages/cliente/MeusCasos` (master-detail), `pages/advogado/MeusCasosAdvogado` (nova), `advogados/` (perfil+áreas), componentes do card/badge/toast/skeleton.
- **Onda 2 (filtros):** filtros/paginação em `advogados`, `processos`, `clientes`; `FilterBar`/`Pagination` no front.
- **Onda 3 (perfis/contatos/cota):** `clientes` (C6), `conexoes`/`advogados` (contatos C5), `planos`/`advogados` (cota A2 + troca plano), `PrivacyField`.

### Data Flow
Página React → `services/` (axios, JWT no header) → `/api/v1/...` (controller, guard, DTO entrada) → service (regras + Prisma, filtro `softDelete:false`) → DTO de resposta por audiência → JSON camelCase → hook `usePaginatedQuery` → componente.

## Architecture Validation Results

### Coherence Validation ✅
- **Compatibilidade:** todas as decisões usam a stack existente (NestJS/Prisma/MySQL + React/Vite/Tailwind), sem conflito de versão. Prisma fixado em ^5.
- **Consistência de padrões:** padrões de naming/API/privacidade derivam do código atual; envelope de paginação e DTOs por audiência são adições coerentes, não rupturas.
- **Alinhamento estrutural:** módulos novos (`areas`, `midia`) seguem o padrão de módulo Nest isolado; `common/` concentra o transversal.

### Requirements Coverage Validation ✅
- **35 FRs cobertos.** Mapeamento: áreas/perfil (FR1-6)→D1; privacidade (FR7,12,30,33)→D3/D6; filtros (FR8-11,13-15,18-25)→D5+D1; master-detail/modais (FR16,29,32)→front; estados (FR17,26-27)→D7; cota/plano (FR28,31)→D8/D9; seed (FR35)→seed.
- **14 NFRs endereçados:** privacidade (NFR1-4)→D3/D4; upload (NFR5)→D6; paginação/performance (NFR6-8)→D5; a11y/compat (NFR9-11)→front/UX; qualidade de entrega (NFR12-14)→processo de dev.

### Gaps encontrados e resolvidos
- **Gap 1 — Filtro de região das oportunidades (FR20):** o `Processo` não tinha localização. **Resolvido:** add `estado`/`cidade` ao Processo, **herdados do cliente ao publicar com opção de ajustar**.
- **Gap 2 — Relatório de situação (FR24/A1):** não havia onde armazenar. **Resolvido:** novo model `RelatorioCaso` (**histórico**, não campo único) — advogado registra entradas ao longo do atendimento.

### Architecture Completeness Checklist
- [x] Contexto, escala e restrições analisados (incl. risco N:N expand-contract)
- [x] Decisões core documentadas (D1-D10)
- [x] Padrões de implementação ancorados no código existente
- [x] Estrutura de projeto mapeada (adições por onda)
- [x] Cobertura de FRs/NFRs verificada; 2 gaps fechados

### Architecture Readiness Assessment
**Status:** READY FOR IMPLEMENTATION. **Confiança: alta.**
- **Forças:** brownfield com convenções claras; fundação (N:N) isolável como walking skeleton; privacidade verificável; faseamento por dependência.
- **Para o futuro (fora desta rodada):** cripto em repouso de documentos, avaliações reais (substituir nota seedada), cache.

### Implementation Handoff
- Primeira prioridade: **Onda 0** — migração expand-contract do schema (Area/AdvogadoArea + campos + Processo.estado/cidade + RelatorioCaso) e seed das 6 áreas mapeando `especializacao`.
- Agentes de dev seguem este documento + os padrões do passo 5 à risca.
