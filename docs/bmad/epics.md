---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-06-14'
storyCount: 23
inputDocuments:
  - 'docs/bmad/prd.md'
  - 'docs/bmad/ux-design-specification.md'
  - 'docs/bmad/architecture.md'
workflowType: 'epics-and-stories'
project_name: 'Ponte Jurídica'
---

# Ponte Jurídica - Epic Breakdown

## Overview

Decomposição em épicos e histórias do **lote de 12 ajustes web** (C1–C6, A1–A6), a partir do PRD (35 FRs, 14 NFRs), UX (12 componentes, 3 fluxos) e Arquitetura (D1–D10). Organizado em **4 ondas por dependência técnica** (PRD/arquitetura): 1 épico por onda. Escopo só WEB.

## Requirements Inventory

### Functional Requirements
- FR1: Advogado cadastra/mantém MÚLTIPLAS áreas de atuação. [A6]
- FR2: Advogado edita perfil (nome, OAB, áreas, estado/cidade). [A6]
- FR3: Advogado visualiza/solicita troca de plano pelo perfil. [A6]
- FR4: Cliente edita dados básicos (nome, idade, e-mail, documento). [C6]
- FR5: Cliente e Advogado enviam/alteram foto de perfil. [C6]
- FR6: Cliente cadastra documentos (CPF/CNPJ) e contato (endereço, telefones). [C6]
- FR7: Sistema distingue dado público de privado; endereço/telefones do dono nunca a terceiros. [C6]
- FR8: Cliente busca advogados por área. [C4]
- FR9: Cliente filtra advogados por nota. [C4]
- FR10: Cliente filtra advogados por estado de atuação. [C4]
- FR11: Cliente filtra advogados por vínculo (vinculado/não). [C4]
- FR12: Cliente vê contatos (e-mail/telefone/WhatsApp) dos advogados vinculados. [C5]
- FR13: Cliente filtra seus casos por tipo de processo. [C1]
- FR14: Cliente filtra seus casos por status. [C1]
- FR15: Cliente ordena casos/propostas por valor (asc/desc). [C1]
- FR16: Cliente navega casos em mestre-detalhe (sidebar=casos; detalhe=propostas recebidas). [C2]
- FR17: Cliente aceita/recusa proposta (via modal). [C2/C3]
- FR18: Advogado vê oportunidades das áreas em que atua. [A3]
- FR19: Advogado filtra oportunidades por tempo de postagem. [A3]
- FR20: Advogado filtra oportunidades por região (estado/cidade do caso). [A3]
- FR21: Advogado define quantidade por página (20/30/50/100). [A4]
- FR22: Advogado vê oportunidades em blocos. [A4]
- FR23: Advogado vê "Meus Casos" agrupados por situação. [A1]
- FR24: Advogado abre detalhe do caso e registra/visualiza relatório de situação (histórico). [A1]
- FR25: Advogado filtra clientes por CPF/CNPJ/nome. [A5]
- FR26: Aceitar proposta transiciona caso aberto→em_atendimento (auto). [C2]
- FR27: Cliente dono OU advogado responsável encerram o caso. [A1/C2]
- FR28: Advogado vê cota de propostas restantes como indicador compacto. [A2]
- FR29: Advogado abre detalhe da cota e inicia upgrade de plano. [A2/A6]
- FR30: Sistema impede proposta acima do limite e informa motivo. [A2]
- FR31: Sistema efetiva troca de plano (atualiza plano + reflete cota). [A6/A2]
- FR32: Sistema usa modais (não diálogos nativos). [C3]
- FR33: Foto pública; documento privado só ao dono autenticado. [C6]
- FR34: Listagens filtradas e paginadas (casos/oportunidades/advogados/clientes). [C1/C4/A3/A4/A5]
- FR35: Seed popula áreas múltiplas, notas e regiões. [demo]

### NonFunctional Requirements
- NFR1: Endereço/telefones privados nunca retornados a quem não é dono/plataforma (verificável DevTools).
- NFR2: Documento privado só via endpoint autenticado do dono; terceiro → 403. Foto pode ser pública.
- NFR3: Contatos de advogado só a clientes vinculados; nunca em busca pública.
- NFR4: DTOs de resposta com allowlist de campos públicos.
- NFR5: Upload restrito a jpg/png/pdf + máx ~5MB; rejeição com mensagem amigável no modal.
- NFR6: Listagens filtradas/paginadas respondem < ~1s no seed.
- NFR7: Filtro/ordenação no backend; cliente não baixa conjunto completo.
- NFR8: Master-detail reflete propostas sem recarregar a página.
- NFR9: Modais operáveis por teclado (foco preso, Esc, retorno de foco).
- NFR10: HTML semântico + ARIA básico (sem auditoria WCAG formal).
- NFR11: Funciona nas 2 últimas versões de Chrome/Edge/Firefox.
- NFR12: Builds front+back passam sem erro antes de cada onda fechar.
- NFR13: Seed reexecutável (idempotente/reset) sem violar constraints.
- NFR14: Zero `window.confirm()`/`alert()` no código web ao final.

### Additional Requirements (Arquitetura)
- AR1: Migração expand-contract (3 passos) — add Area/AdvogadoArea/campos → seed+mapear especializacao → remover coluna legada depois. Nunca big-bang.
- AR2: `Area` (lista controlada, 6 valores seedados) + `AdvogadoArea` (join N:N, PK composta, **hard delete, sem softDelete**).
- AR3: Campos novos — Advogado (nota Decimal(2,1) seedada, estadoAtuacao, cidadeAtuacao, telefone, whatsapp, fotoPath); Cliente (fotoPath, dataNascimento, endereço, telefone, documentoPath).
- AR4: `Processo` ganha `estado`/`cidade` (herdados do cliente ao publicar, ajustáveis) — para filtro de região.
- AR5: `RelatorioCaso` (histórico de relatório de situação por advogado/data).
- AR6: Storage filesystem — `uploads/fotos/` público (via `@nestjs/serve-static`, instalar) + `uploads/documentos/` privado (endpoint autenticado stream, 403 a terceiros).
- AR7: Privacidade por DTO de audiência (AdvogadoPublicoDTO / AdvogadoContatoDTO / ClientePerfilDTO / ClientePublicoDTO).
- AR8: Envelope de paginação único `{data,total,page,pageSize}` + `PaginationQueryDto` compartilhado; filtros via querystring; Prisma where/orderBy/skip/take.
- AR9: Máquina de estados centralizada — aceitar→em_atendimento em transação; **auto-recusa das demais propostas CONFIGURÁVEL** (flag `AUTO_RECUSAR_PROPOSTAS_AO_ACEITAR`, default true); encerrar por dono OU advogado responsável.
- AR10: Cota calculada (limite do plano − count propostas no mês), não armazenada; troca de plano via PATCH recalcula.
- AR11: Toda listagem começa filtrando `softDelete:false` da entidade-alvo, antes dos filtros de negócio.
- AR12: Módulos novos `areas` e `midia`; padrões `/api/v1` + plural + Swagger + PT-BR no domínio.

### UX Design Requirements
- UX-DR1: `<Modal>` reutilizável sobre `<dialog>` nativo (foco preso/Esc/backdrop + transição `@starting-style`); variantes confirm/reforçado/rico. [a11y DoD]
- UX-DR2: `<FormField>` genérico (label+control+erro+hint); variante `<PrivacyField>` (cadeado + público/privado). [a11y DoD]
- UX-DR3: `<FilterBar>`/`<FilterChips>` — reativo (cliente, com debounce na busca) vs. "Aplicar" (advogado, filtros compostos); defaults inteligentes.
- UX-DR4: `<Pagination>` numerada (oculta com 1 página); NÃO scroll infinito.
- UX-DR5: `<StatusBadge>` (cor+ícone+texto por status), `<RatingStars>` (dourado, read-only).
- UX-DR6: `<CaseListItem>` + `<ProposalCard>` (coração do C2; aria-current na seleção).
- UX-DR7: `<EmptyState>` orientador (ícone + frase + CTA) para vazios/filtro sem resultado.
- UX-DR8: `<Avatar>` (fallback iniciais) + `<FileUpload>` (valida tipo/5MB, erro no FormField).
- UX-DR9: `<Toast>` (aria-live) para mudança de estado ("Caso movido para Em atendimento").
- UX-DR10: `<Skeleton>` no detalhe do C2 (não spinner central).
- UX-DR11: Master-detail responsivo (≥900px 2 colunas; <900px empilha; sem pré-seleção no estreito); pré-seleciona `casosFiltrados[0]` em tela larga; "segura" o caso recém-mutado + toast.
- UX-DR12: Tokens — navy #1a3a5c, dourado #c9a84c (só realce), Inter; status aberto/azul, em_atendimento/verde, encerrado/cinza; centralizar no `@theme`.
- UX-DR13: Hook `usePaginatedQuery` (envelope) + `useDebounce` (busca textual com cancelamento).
- UX-DR14: Checklist de a11y por componente no Definition of Done (vira critério de aceite).

### Critério global (DoD transversal)
**UX-DR14 — checklist de a11y por componente** aplica-se a TODO componente novo, em QUALQUER épico (não pertence a um épico específico). Todo componente interativo entregue inclui no aceite: foco/teclado/ARIA conforme sua linha em UX/Component Strategy.

### FR Coverage Map
- FR1 (dados: N:N + campos) → Epic 1 · FR1 (UI: editar áreas no perfil) → Epic 2
- FR2 → Epic 2 (perfil advogado) · FR3, FR31 → Epic 4 (troca de plano, junto da cota — evita dependência futura)
- FR4 → Epic 4 · FR5 (foto: upload+exibir) → Epic 1 · FR6 → Epic 4 · FR7 (privacidade backend) → Epic 1
- FR8–FR11 → Epic 3 (filtros advogado) · FR12 → Epic 4 (contatos)
- FR13–FR15 → Epic 3 (filtros casos cliente) · FR16, FR17 → Epic 2 (master-detail)
- FR18–FR22 → Epic 3 (oportunidades) · FR23, FR24 → Epic 2 (Meus Casos advogado + relatório)
- FR25 → Epic 4 · FR26, FR27 → Epic 2 (transições de estado)
- FR28–FR30 → Epic 4 (cota) · FR31 → Epic 4 (efetivar plano)
- FR32 → Epic 2 (modais) · FR33 (foto pública) → Epic 1 · FR33 (documento privado) → Epic 4
- FR34 (base paginação) → Epic 1 · FR34 (filtros aplicados) → Epic 3 · FR35 (seed) → Epic 1

## Epic List

### Epic 1: Fundação — Áreas múltiplas, perfis ricos e base de mídia/privacidade
Resultado: o sistema passa a suportar advogados com MÚLTIPLAS áreas de atuação e perfis ricos (estado/cidade, contatos, foto), com privacidade imposta no backend e mídia armazenada; o seed demonstra tudo isso. Estabelece o esqueleto técnico (N:N, storage, paginação, componentes-base) que as ondas seguintes consomem — mas já entrega dados ricos visíveis.
**FRs:** FR1(dados), FR5, FR7, FR33(foto), FR34(base), FR35 • **ARs:** AR1–AR12 • **UX-DR:** 1,2,4,8,12,13
**Nota de migração (expand-contract):** o Epic 1 fecha com **expand + populate** (add Area/AdvogadoArea/campos + seed + mapear `especializacao`). A **contração (remover a coluna `especializacao`) é uma story TARDIA**, agendada para o fim do lote — fora do "Epic 1 done" — com aceite "nenhum código referencia `especializacao`" (verificável por grep), só após Epics 2–3 pararem de ler a coluna.

### Epic 2: Núcleo do fluxo cliente↔advogado (espinha da demo)
Resultado: o cliente compara e aceita propostas num master-detail; o advogado acompanha "Meus Casos" por situação e registra relatórios; ambos encerram casos; advogado edita perfil multi-área e troca de plano; todas as confirmações via modal.
**FRs:** FR1(UI), FR2, FR16, FR17, FR23, FR24, FR26, FR27, FR32 • **UX-DR:** 1,5,6,7,9,10,11,14

### Epic 3: Descoberta e filtros (encontrar o advogado/caso certo)
Resultado: cliente filtra casos (tipo/status/valor) e advogados (nota/estado/vínculo); advogado filtra oportunidades (tempo/região) em blocos com quantidade configurável — tudo server-side e paginado.
**FRs:** FR8–FR15, FR18–FR22, FR34(filtros) • **UX-DR:** 3,4,5,13

### Epic 4: Perfil do cliente, contatos e cota
Resultado: cliente edita perfil completo com privacidade visível; vê contatos dos advogados vinculados; advogado filtra clientes e gerencia cota (indicador + modal de upgrade efetivado).
**FRs:** FR4, FR6, FR12, FR25, FR28–FR31, FR33(documento) • **UX-DR:** 2,3,7

### Story de limpeza (tardia, fim do lote)
**Contração da migração:** remover a coluna `especializacao` do model Advogado após Epics 2–3 não a lerem mais. Aceite: grep por `especializacao` não retorna referências de código; build passa; seed reexecutável.

---

## Epic 1: Fundação — Áreas múltiplas, perfis ricos e base de mídia/privacidade

Estabelece o esqueleto técnico (N:N de áreas, campos ricos, storage, privacidade, paginação, componentes-base) que as demais ondas consomem, já entregando dados ricos demonstráveis via seed. **Fecha com expand+populate; a contração da coluna legada é story tardia.**

### Story 1.1: Migração de áreas (N:N) — expand + seed + mapeamento
As a desenvolvedor,
I want migrar `Advogado.especializacao` (String) para um relacionamento N:N de áreas controladas,
So that um advogado possa atuar em múltiplas áreas e os filtros por área funcionem.

**Acceptance Criteria:**

**Given** o schema atual com `especializacao String`
**When** aplico a migração de expansão
**Then** existem os models `Area` (`@@map("area")`) e `AdvogadoArea` (`@@map("advogado_area")`, PK composta `@@id([advogadoId, areaId])`, **sem softDelete — hard delete**)
**And** a coluna `especializacao` é **preservada** (expand-contract; remoção é story tardia).

**Given** a migração aplicada
**When** rodo o seed
**Then** as 6 áreas (Criminal, Trabalhista, Família, Cível, Tributário, Previdenciário) existem em `Area`
**And** cada advogado existente recebe em `AdvogadoArea` a área correspondente à sua `especializacao` antiga
**And** o seed é reexecutável sem violar constraints (NFR13).

### Story 1.2: Campos ricos de perfil e modelos de caso
As a desenvolvedor,
I want adicionar os campos ricos de Advogado/Cliente, localização do caso e o histórico de relatório,
So that perfis, filtros de região e relatórios de situação tenham onde existir.

**Acceptance Criteria:**

**Given** o schema com áreas
**When** aplico a migração de campos
**Then** `Advogado` tem `nota Decimal(2,1)?`, `estadoAtuacao`, `cidadeAtuacao`, `telefone`, `whatsapp`, `fotoPath`
**And** `Cliente` tem `fotoPath`, `dataNascimento`, campos de endereço, `telefone`, `documentoPath`
**And** `Processo` tem `estado` e `cidade`
**And** existe o model `RelatorioCaso` (`@@map("relatorio_caso")`, com advogadoId, texto, dataCriacao, softDelete).

**Given** os novos campos
**When** rodo o seed demo
**Then** os advogados têm `nota` variada, `estado/cidade` diversos e **≥2 áreas** em parte deles (para todos os filtros terem resultado — FR35).

### Story 1.3: Storage de mídia (foto pública, documento privado)
As a usuário (cliente/advogado),
I want enviar foto de perfil e documento, com a foto pública e o documento privado,
So that minha identidade visual apareça e meus documentos sensíveis fiquem protegidos.

**Acceptance Criteria:**

**Given** o backend
**When** envio uma foto via endpoint de upload
**Then** o arquivo é validado (jpg/png/pdf, ≤5MB) e salvo em `uploads/fotos/`; o path é persistido
**And** arquivo fora da regra retorna 400 com mensagem PT-BR (NFR5).

**Given** uma foto salva
**When** acesso sua URL estática (`@nestjs/serve-static` em `/uploads/fotos`)
**Then** ela é servida publicamente (FR33 foto).

**Given** um documento privado salvo em `uploads/documentos/`
**When** o próprio dono o solicita via `GET /api/v1/midia/documento` autenticado
**Then** o arquivo é transmitido (stream)
**And** quando um terceiro tenta acessá-lo, recebe **403** (NFR2).

### Story 1.4: Privacidade por DTO de audiência
As a plataforma,
I want que os endpoints retornem apenas os campos permitidos por audiência,
So that endereço/telefones privados nunca vazem para terceiros.

**Acceptance Criteria:**

**Given** endpoints que retornam Advogado/Cliente
**When** a resposta é montada
**Then** ela passa por um DTO/mapper de audiência (`AdvogadoPublicoDTO`, `AdvogadoContatoDTO`, `ClientePerfilDTO`, `ClientePublicoDTO`) — nunca entidade Prisma crua.

**Given** uma busca pública de advogados
**When** inspeciono a resposta no DevTools
**Then** **não** há telefone/whatsapp/email no JSON (NFR1, NFR4)
**And** endereço/telefones de cliente só aparecem na resposta do próprio dono.

### Story 1.5: Contrato de paginação e hook de consumo
As a desenvolvedor,
I want um envelope de paginação único e um hook de consumo,
So that todas as listagens filtradas sejam consistentes e server-side.

**Acceptance Criteria:**

**Given** o backend
**When** crio o `PaginationQueryDto` e o tipo `PaginatedDTO<T>`
**Then** toda listagem paginada retorna `{ data, total, page, pageSize }` (page default 1, pageSize default 20)
**And** filtro/ordenação usam Prisma where/orderBy/skip/take, nunca em memória (NFR7).

**Given** o front
**When** crio `usePaginatedQuery` e `useDebounce`
**Then** o hook consome o envelope e a busca textual usa debounce + cancela requisição anterior (UX-DR13).

### Story 1.6: Componentes-base de UI e tokens
As a desenvolvedor de front,
I want os componentes transversais e os tokens de tema,
So that as telas das próximas ondas tenham fundação visual consistente e acessível.

**Acceptance Criteria:**

**Given** o front
**When** crio `<Modal>` (sobre `<dialog>` nativo)
**Then** ele tem foco preso, fecha com Esc e backdrop, transição `@starting-style`, e título com `aria-labelledby` (UX-DR1; checklist a11y — UX-DR14).

**Given** o front
**When** crio `<FormField>` (+variante `<PrivacyField>`), `<Avatar>`, `<FileUpload>`
**Then** `<FormField>` exibe label/erro/hint com `aria-invalid`; `<FileUpload>` valida tipo/5MB e mostra erro no campo (UX-DR2, UX-DR8).

**Given** o tema
**When** centralizo os tokens no `@theme`
**Then** existem cores de status (aberto/azul, em_atendimento/verde, encerrado/cinza) e a regra "dourado só para realce" é respeitada (UX-DR12).

---

## Epic 2: Núcleo do fluxo cliente↔advogado (espinha da demo)

O coração demonstrável: comparar/aceitar propostas (master-detail), gerir casos do advogado com relatório, encerrar, perfil multi-área e modais.

### Story 2.1: Confirmações via modal (substituir window.confirm)
As a usuário,
I want que as confirmações apareçam em modais estilizados,
So that a experiência seja profissional e consistente.

**Acceptance Criteria:**

**Given** as telas que hoje usam `window.confirm()` (MeusCasos, MinhasConexoes)
**When** uma ação de confirmação é disparada
**Then** abre o `<Modal>` de confirmação (não o diálogo nativo)
**And** ao final do épico, grep por `window.confirm`/`alert` no front não retorna ocorrências (NFR14, FR32).

### Story 2.2: Master-detail de Meus Casos (cliente)
As a cliente,
I want ver meus casos numa lista e as propostas do caso selecionado ao lado,
So that eu compare e decida sem perder o caso de vista.

**Acceptance Criteria:**

**Given** Meus Casos em tela larga (≥900px)
**When** a página carrega
**Then** a sidebar lista meus casos e o detalhe abre com `casosFiltrados[0]` pré-selecionado (FR16, UX-DR11)
**And** selecionar outro caso troca o detalhe sem recarregar a página (NFR8), com skeleton enquanto carrega (UX-DR10).

**Given** tela estreita (<900px)
**When** acesso Meus Casos
**Then** a sidebar empilha no topo e não há pré-seleção automática (UX-DR11).

**Given** um filtro aplicado na sidebar
**When** troco o filtro e a lista muda
**Then** a seleção move para o **primeiro item da lista filtrada** (em tela larga); se a lista filtrada fica vazia, o detalhe mostra `<EmptyState>`.

**Given** um caso vazio de propostas ou lista vazia
**When** renderiza
**Then** exibe `<EmptyState>` orientador (UX-DR7).

### Story 2.3: Aceitar proposta e transição de estado (auto-recusa configurável)
As a cliente,
I want aceitar uma proposta e o caso passar a "em atendimento",
So that o atendimento comece e fique claro qual advogado foi escolhido.

**Acceptance Criteria:**

**Given** um caso aberto com propostas
**When** aceito uma proposta (via modal)
**Then** numa transação: a proposta vira "aceita" e o caso vai de aberto→em_atendimento (FR17, FR26)
**And** se a flag `AUTO_RECUSAR_PROPOSTAS_AO_ACEITAR` estiver ligada (default), as demais propostas do caso são recusadas; se desligada, permanecem pendentes (AR9).

**Given** o caso recém-aceito sai do filtro ativo
**When** a tela atualiza
**Then** o detalhe **segura** o caso visível com o novo status e exibe `<Toast>` "Caso movido para Em atendimento" (UX-DR9, UX-DR11).

### Story 2.4: Encerrar caso (cliente ou advogado)
As a cliente dono ou advogado responsável,
I want encerrar um caso a partir do seu detalhe,
So that casos concluídos saiam do fluxo ativo.

**Acceptance Criteria:**

**Given** o detalhe de um caso
**When** clico em "Encerrar"
**Then** abre um `<Modal>` reforçado (mais enfático que recusar) (UX-DR1 variante)
**And** ao confirmar, o status vai para "encerrado" (FR27).

**Given** a regra de autorização
**When** quem encerra é o cliente dono OU o advogado responsável
**Then** a transição é permitida; qualquer outro usuário recebe 403
**And** o status encerrado reflete nos dois lados ao recarregar.

### Story 2.5: Perfil do advogado — editar dados e múltiplas áreas
As a advogado,
I want editar meu nome, OAB, estado/cidade e gerenciar minhas áreas de atuação,
So that meu perfil reflita corretamente onde e em que atuo.

**Acceptance Criteria:**

**Given** Meu Perfil (advogado)
**When** edito nome/OAB/estado/cidade e salvo
**Then** os dados persistem e a tela confirma com toast (FR2).

**Given** a seção de áreas
**When** adiciono ou removo áreas (tags)
**Then** os vínculos em `AdvogadoArea` são criados/removidos (hard delete) e o advogado passa a aparecer/sumir dos filtros daquelas áreas (FR1 UI).

### Story 2.6: "Meus Casos" do advogado + relatório de situação
As a advogado,
I want uma tela com meus casos por situação e poder registrar relatórios,
So that eu acompanhe e documente o andamento de cada atendimento.

**Acceptance Criteria:**

**Given** o advogado logado
**When** acesso a nova tela "Meus Casos"
**Then** vejo meus casos agrupados por situação (aberto/em atendimento/encerrado) com `<StatusBadge>` (FR23)
**And** a rota nova está na navegação do advogado.

**Given** o detalhe de um caso meu
**When** registro um relatório de situação
**Then** uma entrada em `RelatorioCaso` é criada (advogado, texto, data)
**And** o histórico aparece com a mais recente no topo (FR24).

---

## Epic 3: Descoberta e filtros

Tudo server-side e paginado: filtros de casos, advogados e oportunidades.

### Story 3.1: Componentes de filtro/paginação + filtros de Meus Casos (cliente)
As a cliente,
I want filtrar e ordenar meus casos,
So that eu encontre rapidamente o caso certo.

**Acceptance Criteria:**

**Given** o front
**When** crio `<FilterBar>`/`<FilterChips>` e `<Pagination>`
**Then** chips/selects são acessíveis (role/aria-pressed, alvo ≥40px) e a paginação é numerada, **oculta com 1 página**, sem scroll infinito (UX-DR3, UX-DR4).

**Given** Meus Casos
**When** aplico filtros de tipo de processo, status e ordenação por valor (asc/desc)
**Then** a lista (sidebar) reflete o filtro server-side, com filtro reativo (cliente) (FR13, FR14, FR15)
**And** a seleção do master-detail respeita o filtro (caso fora do filtro não fica pré-selecionado).

### Story 3.2: Filtros de busca de advogados (cliente)
As a cliente,
I want filtrar advogados por área, nota, estado e vínculo,
So that eu escolha com base em informação real.

**Acceptance Criteria:**

**Given** Encontrar Advogado
**When** filtro por área, nota mínima, estado de atuação e situação de vínculo (vinculado/não)
**Then** a listagem retorna paginada (envelope) e server-side, começando por `softDelete:false` da entidade (FR8–FR11, AR11)
**And** os resultados usam `AdvogadoPublicoDTO` (sem contatos privados).

**Given** filtros sem resultado
**When** a busca retorna vazio
**Then** exibe `<EmptyState>` orientando afrouxar filtros (UX-DR7).

### Story 3.3: Filtros de oportunidades (advogado)
As a advogado,
I want filtrar oportunidades por tempo de postagem e região, já vendo minhas áreas por padrão,
So that eu encontre casos relevantes sem esforço.

**Acceptance Criteria:**

**Given** Oportunidades
**When** a tela abre
**Then** já vem filtrada pelas áreas em que atuo (default inteligente) (FR18, UX-DR3).

**Given** os filtros compostos
**When** ajusto tempo de postagem e região (estado/cidade do caso) e clico "Aplicar"
**Then** a listagem server-side reflete os filtros (FR19, FR20)
**And** a região filtra por `Processo.estado/cidade`.

### Story 3.4: Oportunidades em blocos + quantidade por página
As a advogado,
I want ver oportunidades em blocos e escolher quantas por página,
So that eu controle a densidade da listagem.

**Acceptance Criteria:**

**Given** Oportunidades
**When** a listagem renderiza
**Then** os casos aparecem em blocos retangulares (FR22)
**And** posso escolher 20/30/50/100 por página, refletido no `pageSize` do envelope (FR21, FR34)
**And** a paginação numerada navega as páginas.

---

## Epic 4: Perfil do cliente, contatos e cota

Fecha o lote: perfil rico do cliente com privacidade, contatos de vinculados, filtro de clientes e gestão de cota/plano.

### Story 4.1: Minha Conta do cliente (edição + privacidade)
As a cliente,
I want editar meu perfil completo entendendo o que é público e o que é privado,
So that eu mantenha meus dados e confie na plataforma.

**Acceptance Criteria:**

**Given** Minha Conta
**When** edito nome, idade (via data de nascimento), e-mail, documento e envio foto
**Then** os dados persistem; a foto sobe via `<FileUpload>` (FR4, FR5).

**Given** os campos privados (endereço, telefones, documento)
**When** renderizam
**Then** usam `<PrivacyField>` com cadeado + microcópia "privado — só você e a plataforma" (FR6, FR7 UI)
**And** o documento é enviado para storage privado e nunca exposto a terceiros (FR33 documento).

### Story 4.2: Contatos dos advogados vinculados
As a cliente,
I want ver e-mail/telefone/WhatsApp dos advogados aos quais estou vinculado,
So that eu dê continuidade ao atendimento.

**Acceptance Criteria:**

**Given** Meus Advogados (vinculados)
**When** a lista renderiza
**Then** mostra os contatos (e-mail/telefone/WhatsApp) via `AdvogadoContatoDTO` (FR12)
**And** esses contatos só são retornados porque há vínculo `ClienteAdvogado` — nunca em busca pública (NFR3).

### Story 4.3: Filtro de clientes (advogado)
As a advogado,
I want filtrar meus clientes por CPF/CNPJ ou nome,
So that eu localize rapidamente um cliente.

**Acceptance Criteria:**

**Given** Meus Clientes
**When** digito CPF/CNPJ ou nome
**Then** a busca é server-side com debounce e retorna paginada (FR25, UX-DR3)
**And** começa filtrando `softDelete:false` (AR11).

### Story 4.4: Indicador de cota e bloqueio de limite
As a advogado,
I want ver minha cota de propostas e ser impedido (com explicação) ao atingir o limite,
So that eu entenda meu consumo sem encontrar erros crus.

**Acceptance Criteria:**

**Given** o advogado logado
**When** vejo o indicador de cota
**Then** ele mostra restantes/limite de forma compacta, calculado como `limite − count(propostas no mês)` (FR28, AR10).

**Given** a cota
**When** clico no indicador
**Then** abre `<Modal>` com consumo + CTA de upgrade (FR29).

**Given** tento enviar proposta acima do limite
**When** a cota está esgotada
**Then** o sistema impede e informa o motivo, oferecendo upgrade (FR30) — sem erro cru.

### Story 4.5: Troca de plano (upgrade efetivado)
As a advogado,
I want trocar de plano a partir do perfil ou do modal de cota,
So that eu amplie meu limite de propostas quando precisar.

**Acceptance Criteria:**

**Given** o advogado no perfil ou no modal de cota
**When** vejo os planos disponíveis
**Then** posso selecionar um plano e solicitar a troca (FR3).

**Given** solicito a troca de plano
**When** confirmo o upgrade
**Then** o `planoId` é atualizado (PATCH `/api/v1/advogado/plano`) e a cota recalcula automaticamente com o novo limite (FR31, AR10)
**And** sem cobrança real (fora de escopo) — apenas o estado interno muda.

---

## Story de limpeza (tardia): Contração da migração
As a desenvolvedor,
I want remover a coluna legada `especializacao` após ninguém mais lê-la,
So that o schema fique limpo sem o campo obsoleto.

**Acceptance Criteria:**

**Given** Epics 2 e 3 concluídos (código usa só `AdvogadoArea`)
**When** aplico a migração de contração
**Then** a coluna `especializacao` é removida do model Advogado
**And** grep por `especializacao` não retorna referências de código
**And** build front+back passa e o seed é reexecutável (NFR12, NFR13).
