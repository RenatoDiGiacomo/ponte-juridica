---
stepsCompleted: [1, 2, 3, 4]
pausedAt: 'step-05-patterns (próximo); decisões core concluídas'
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
