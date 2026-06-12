---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
visionPriority:
  demoBackbone: 'gestao-de-fluxo (master-detail propostas C2, Meus Casos advogado A1, cota A2)'
  technicalDepth: 'confianca-escolha (multiplas areas A6 fundacao, filtros C4/A3, privacidade C5/C6)'
  hygiene: 'verniz (modais C3, blocos+quantidade A4, layout mockup)'
classification:
  projectType: 'web-app-fullstack'
  domain: 'legaltech-marketplace'
  complexity: 'medium'
  projectContext: 'brownfield'
  implementationRisk: 'high'
  riskReason: 'Migração especializacao String → relacionamento N:N de áreas (#A6) é fundação dos filtros C4/A3 e quebra leituras existentes'
  nfr: 'data-privacy'
  nfrReason: 'Dados pessoais com visibilidade controlada (#C5/#C6): endereço/telefones privados, contatos visíveis a vínculos'
inputDocuments:
  - 'CLAUDE.md'
  - 'Documentos/Alinhamentos e Ajustes/Ponte jurídica Alterações.txt'
  - 'Documentos/Alinhamentos e Ajustes/Alterações - 06/Meus casos.png'
  - 'backend/prisma/schema.prisma'
workflowType: 'prd'
projectType: 'brownfield'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 4
---

# Product Requirements Document - Ponte Jurídica

**Author:** Rafael Mattiuzzo
**Date:** 2026-06-12

## Executive Summary

A **Ponte Jurídica** é um marketplace jurídico (LegalTech) que conecta clientes com necessidades jurídicas a advogados especializados de forma transparente: o cliente publica um caso, advogados disputam com propostas, e o cliente escolhe pelo mérito — área de atuação, valor e reputação — em vez de indicação. O produto já está funcional (NestJS + Prisma + MySQL no backend; React + Vite + Tailwind no front; Expo no mobile).

Este PRD cobre um **lote incremental de 12 ajustes (C1–C6 cliente, A1–A6 advogado), escopo exclusivamente WEB**, levantado pela equipe após uso do produto. O lote ataca três lacunas que hoje enfraquecem a proposta de marketplace:

1. **Escolha informada (confiança):** o cliente decide quase no escuro. Filtros por nota, estado de atuação e vínculo (C4), exibição de contatos (C5) e perfis ricos com múltiplas áreas de atuação (C6/A6) dão base real à decisão "qual advogado".
2. **Gestão de fluxo:** cliente e advogado perdem o senso de "onde cada coisa está". A sidebar master-detail de propostas (C2), a nova tela "Meus Casos" do advogado (A1) e a cota de propostas visível (A2) fecham o ciclo publicar → propor → comparar → aceitar → atender.
3. **Profissionalização da experiência:** modais no lugar de window.confirm() (C3), casos em blocos com filtro de quantidade (A4) e o layout do mockup elevam a percepção de qualidade.

**Fora de escopo nesta rodada:** aplicativo mobile (Expo); autenticação/login; planos e pagamento real (apenas a UI de "trocar plano", sem cobrança); o fluxo de propostas já existente (criar/aceitar/recusar permanece como está). Sistema de avaliações reais — **a nota exibida é seedada/mockada nesta rodada**; avaliações de verdade ficam no roadmap futuro.

### What Makes This Special

O diferenciador que este lote consolida é o **matching comparável**: um advogado pode atuar em **várias áreas** e ser **comparado por nota e região**, transformando uma simples lista de advogados num marketplace com triagem real. Por isso a migração do campo único `especializacao` para um relacionamento **N:N de áreas (#A6) é a fundação técnica** — destrava os filtros de confiança (C4, A3).

**Riscos técnicos do lote:**
- 🔴 **Migração N:N de áreas (#A6)** — quebra leituras existentes de `especializacao`; é fundação de C4/A3.
- 🟠 **Upload/armazenamento de mídia (#C6)** — foto e documentos exigem decisão de storage (filesystem vs. base64 vs. externo) ainda não existente no projeto.

**Prioridade de execução (contexto acadêmico — MBA):**
- 🎯 **Espinha dorsal da demo:** gestão de fluxo (eixo 2) — conta a história cliente↔advogado ao vivo.
- 🧠 **Profundidade técnica defendida na banca:** confiança/escolha (eixo 1) — N:N, filtros compostos, privacidade.
- ✨ **Higiene visual:** verniz (eixo 3) — rápido, feito em paralelo.

## Project Classification

- **Tipo:** Web app full-stack (SPA React + REST NestJS)
- **Domínio:** Marketplace jurídico (LegalTech, two-sided)
- **Complexidade de domínio:** Média
- **Contexto:** Brownfield (produto funcional, lote incremental)
- **Riscos técnicos altos:** (1) migração `especializacao` → N:N de áreas (#A6); (2) upload de mídia (#C6)
- **NFR crítico — privacidade:** dados pessoais com visibilidade controlada (#C5/#C6): endereço e telefones privados (visíveis só à plataforma e ao próprio dono); contatos visíveis a vínculos.

## Success Criteria

### User Success
- **Cliente** consegue, em Meus Casos, filtrar por tipo/status/valor e ver suas propostas numa sidebar master-detail (clica no caso → abre as propostas recebidas), sem recarregar a página.
- **Cliente** escolhe um advogado com base em informação real: nota, estado de atuação e se já tem vínculo aparecem como filtros em Encontrar Advogado.
- **Cliente** acessa os contatos (e-mail/telefone/WhatsApp) dos advogados vinculados em Meus Advogados.
- **Cliente** edita seu perfil completo (foto, documento, dados básicos) e entende quais campos são privados — endereço e telefones nunca aparecem para terceiros.
- **Advogado** acompanha seus casos numa tela "Meus Casos" por situação (aberto/em atendimento/encerrado) e abre o detalhe/relatório de cada um.
- **Advogado** se cadastra em múltiplas áreas de atuação e aparece nos filtros de todas elas.
- Nenhum diálogo de confirmação usa `window.confirm()` — todos viram modal estilizado.

### Business Success (proxy acadêmico)
- **100% dos 12 itens (C1–C6, A1–A6)** implementados e funcionais no ambiente web.
- O **fluxo completo cliente↔advogado** (publicar → propor → comparar → aceitar → atender) é demonstrável ponta a ponta com as contas demo, sem erro.
- A banca consegue ver, na mesma sessão, um advogado multi-área sendo encontrado por filtro de região + nota — provando o diferenciador de "matching comparável".

### Technical Success
- Migração `especializacao` String → relacionamento N:N de áreas concluída, com **seed atualizado** e nenhuma leitura quebrada (Oportunidades, Buscar Advogado, perfis).
- **Storage de mídia:** arquivos de foto/documento salvos no **filesystem do backend** e servidos por URL estática; caminho persistido no banco. (S3/externo = roadmap.)
- **Privacidade imposta no backend:** a serialização dos endpoints omite endereço/telefones privados para qualquer consumidor que não seja o próprio dono ou a plataforma — verificável via DevTools.
- Filtros (nota, região, tempo de postagem, quantidade) resolvidos no backend com paginação, não filtrando no cliente.
- `npm run build` do front e build do backend passam sem erro antes de considerar "pronto".

### Measurable Outcomes
- 12/12 itens marcados done com aceite individual (critérios de aceite por item definidos nas stories).
- 0 ocorrências de `window.confirm()`/`alert()` no código web ao final.
- **Seed reexecutável** (idempotente ou com reset) — re-seedar ao vivo não pode quebrar por constraint.
- Seed gera ao menos: advogados com ≥2 áreas, notas variadas e estados diferentes — para que todos os filtros tenham resultado demonstrável.
- Tempo de resposta dos endpoints de listagem filtrada aceitável para demo (< ~1s no dataset de seed).

## Product Scope

### MVP - Minimum Viable Product (esta rodada)
Os 12 itens, lado WEB:
- **Fundação:** N:N de áreas (#A6) + storage de mídia + modelo de privacidade.
- **Cliente:** C1 filtros Meus Casos · C2 sidebar master-detail · C3 modais · C4 filtros avançados de advogado · C5 contatos · C6 edição de perfil com privacidade.
- **Advogado:** A1 Meus Casos · A2 cota com modal · A3 filtros (tempo/região) · A4 blocos+quantidade · A5 filtro de clientes · A6 perfil editável + múltiplas áreas + UI de troca de plano.

**Núcleo crítico (inegociável se o tempo apertar):** A6 (N:N de áreas) + C2 (master-detail) + A1 (Meus Casos do advogado) + C3 (modais). O restante é desejável, nessa ordem de prioridade.

### Growth Features (Post-MVP)
- Sistema de **avaliações reais** (substituir nota seedada).
- Cobrança/pagamento real na troca de plano.
- Paridade mobile (Expo) das mesmas telas.

### Vision (Future)
- Mensageria cliente↔advogado in-app, contratação com assinatura digital, dashboard de reputação.

## User Journeys

### Jornada 1 — Cliente (caminho feliz): da dúvida à escolha informada
**Persona:** Joana, 38, abriu um caso de revisão de aposentadoria. Já publicou antes, mas se sentia perdida com as propostas chegando soltas.

- **Cena de abertura:** Joana entra em *Meus Casos*. Antes via uma lista vertical longa e confusa. Agora o título é enxuto e há uma **sidebar "Propostas enviadas"** à esquerda. (C2)
- **Ação:** Ela filtra pelo topo — só casos **"Em atendimento"**, ordenados por **valor crescente**. (C1) Clica no caso "Revisão de aposentadoria" na sidebar → o painel à direita abre as **propostas recebidas** daquele caso. (C2)
- **Clímax:** Duas propostas. Joana quer decidir bem: vai em *Encontrar Advogado*, filtra por **Previdenciário + estado RS + nota ≥ 4 + "ainda não vinculados"** e confirma que o Dr. Felipe tem reputação e atua na região dela. (C4)
- **Resolução:** Aceita a proposta — agora via **modal estilizado**, não um confirm() cru. (C3) O caso vira "Em atendimento". Em *Meus Advogados*, ela já vê **e-mail, telefone e WhatsApp** do Dr. Felipe para dar continuidade fora da plataforma. (C5)

*Revela:* filtros server-side de casos, master-detail de propostas, filtros avançados de advogado (nota/estado/vínculo), modais reutilizáveis, exibição de contatos de vinculados.

### Jornada 2 — Cliente (perfil & privacidade): controlar o que é meu
**Persona:** a mesma Joana, primeira vez editando o perfil.

- **Abertura:** Em *Minha Conta*, o perfil era só leitura. Agora ela **edita foto, documento (CPF), nome, idade e e-mail**. (C6)
- **Tensão:** Ela preenche **endereço e telefones**, mas vê o rótulo "🔒 privado — visível só para você e a plataforma". (C6 + NFR privacidade)
- **Resolução:** Joana confia: o que é sensível não vai aparecer para advogados. *(E de fato o backend não devolve esses campos a terceiros — verificável.)*

*Revela:* upload de mídia (filesystem), edição de perfil do cliente, modelo de visibilidade imposto no backend.

### Jornada 3 — Advogado (caminho feliz): multi-área, oportunidades e gestão
**Persona:** Dr. Felipe, atua em **Previdenciário e Trabalhista**, plano Profissional.

- **Abertura:** Em *Meu Perfil*, ele edita Nome/OAB e **cadastra mais de uma área de atuação** — antes só cabia uma. (A6) Vê também um botão de **trocar de plano**. (A6)
- **Ação:** Em *Oportunidades*, filtra por **tempo de postagem (últimos 7 dias) + região (RS/Porto Alegre)**, escolhe ver **20 casos por página** em blocos retangulares. (A3, A4) Como atua em duas áreas, casos de ambas aparecem. (A6)
- **Tensão:** Ao enviar proposta, vê a **cota como número pequeno (17/20)**; clica e abre um **modal** explicando o consumo e ofertando upgrade. (A2)
- **Clímax/Resolução:** Joana aceita. Em *Meus Casos* (tela nova), o Dr. Felipe acompanha o caso como **"Em atendimento"**, abre o detalhe e registra um **relatório de situação**. (A1) Em *Meus Clientes*, encontra Joana filtrando por **nome/CPF**. (A5)

*Revela:* perfil de advogado editável com N:N de áreas + UI de plano, filtros de oportunidades (tempo/região/quantidade) em blocos, indicador de cota com modal, tela "Meus Casos" do advogado com detalhe/relatório, filtro de clientes.

### Jornada 4 — Advogado (edge case): cota esgotada
**Persona:** Dr. Felipe num mês cheio.

- Ele chega a **20/20 propostas**. Ao tentar a 21ª, o indicador de cota (A2) e o modal explicam o limite do plano e oferecem **upgrade** (A6 — UI de troca de plano). Sem erro cru, sem confirm().

*Revela:* enforcement do limite mensal por plano na UI + caminho de recuperação (upgrade).

### Journey Requirements Summary
- **Listagens com filtro server-side + paginação:** Meus Casos (C1), Oportunidades (A3/A4), Encontrar Advogado (C4), Meus Clientes (A5).
- **Master-detail:** propostas por caso na sidebar do cliente (C2).
- **Componentes transversais:** Modal reutilizável (C3, A2), badge de cota (A2).
- **Perfis ricos + mídia:** edição cliente (C6) e advogado (A6), upload no filesystem, N:N de áreas.
- **Privacidade:** serialização condicional no backend (C5/C6).
- **Tela nova:** "Meus Casos" do advogado com detalhe + relatório de situação (A1).
- **UI de plano:** troca/upgrade de plano disparada por perfil e por cota (A6/A2).

> **Nota de escopo:** sem jornada de admin/API nesta rodada — autenticação e administração estão fora de escopo.

## Domain-Specific Requirements

### Compliance & Regulatory
- **LGPD (Lei 13.709/2018) — princípio aplicado, não certificação:** o lote passa a tratar dados pessoais (CPF/CNPJ, endereço, telefones, foto, documentos). Mesmo sendo projeto acadêmico, adotamos os princípios de **minimização** (só expor o necessário) e **finalidade** (contatos visíveis apenas a quem tem vínculo). Não há DPO, consentimento formal ou política de retenção nesta rodada — registrado como dívida consciente.

### Technical Constraints
- **Privacidade por padrão (server-side):** endereço e telefones são privados; a API nunca os retorna a terceiros. A regra vive no backend (serialização condicional por papel/propriedade), não no front. Critério de aceite: inspecionar a resposta no DevTools não revela dado privado.
- **Contatos com escopo de vínculo:** e-mail/telefone/WhatsApp do advogado só aparecem para clientes efetivamente vinculados a ele (ClienteAdvogado), nunca em listagens públicas de busca.
- **Classificação de mídia (decidido):**
  - **Foto de perfil → pública**, servida como arquivo estático.
  - **Documento (CPF/CNPJ/RG) → privado**, servido **somente por endpoint autenticado do próprio dono** (nunca por URL estática adivinhável). Caso de teste negativo: acesso de terceiro à mídia → 403.
- **Armazenamento:** arquivos no filesystem do backend; nesta rodada sem criptografia em repouso (dívida consciente para roadmap).

### UI/Transparência
- *Minha Conta* sinaliza visualmente os campos/documentos privados (cadeado + texto "seus documentos são privados e nunca compartilhados"), amarrando com a Jornada 2 — privacidade percebida gera confiança.

### Integration Requirements
- Nenhuma integração externa nova nesta rodada (sem gateway de pagamento, sem serviço de e-mail, sem storage em nuvem). A "troca de plano" (A6) altera apenas o estado interno, sem cobrança real.

### Risk Mitigations
- **Vazamento de dado privado por endpoint:** mitigado por testes de serialização e revisão dos DTOs de resposta de Advogado/Cliente (allowlist de campos públicos vs. privados).
- **Documento sensível acessível por URL adivinhável:** servir mídia privada (documentos) por endpoint autenticado, não por URL estática pública.
- **Nota seedada confundida com avaliação real:** rotular na UI que a reputação é demonstrativa nesta versão.

### Dívidas conscientes (roadmap, fora desta rodada)
- Criptografia em repouso de documentos, política de retenção/expurgo, consentimento formal LGPD, antivírus/validação profunda de upload.

## Web App — Requisitos Específicos

### Project-Type Overview
SPA React (Vite) consumindo API REST NestJS. Aplicação autenticada (cliente/advogado), sem superfície pública indexável. Este lote é incremental sobre a SPA existente — nenhuma mudança de arquitetura de runtime, apenas novas telas/componentes e endpoints.

### Technical Architecture Considerations
- **Roteamento:** SPA com React Router; rotas novas para "Meus Casos" do advogado (A1) e telas de edição de perfil. Rotas públicas (se houver) antes do shell autenticado.
- **Estado de dados:** fetch sob demanda por tela; refetch após mutações (aceitar/recusar proposta, salvar perfil). Sem cache global sofisticado nesta rodada.
- **Filtros e paginação:** resolvidos no backend (query params), nunca no cliente — vale para Meus Casos (C1), Oportunidades (A3/A4), Buscar Advogado (C4), Meus Clientes (A5). Padrão de querystring consistente: `?area=&estado=&nota=&postadoDesde=&page=&pageSize=&sort=`.
- **Envelope de paginação único (decidido):** toda listagem paginada retorna `{ data: [...], total, page, pageSize }`. Um único formato em todos os endpoints → um único hook de filtro/paginação reutilizável no front.
- **Componentes transversais novos:** `<Modal>` reutilizável (substitui window.confirm em C3/A2 e ancora o modal de cota), badge de cota, controles de filtro (chips + selects), upload de arquivo.

### browser_matrix
- Evergreen: últimas 2 versões de Chrome, Edge, Firefox. Sem suporte a IE/legado. Demo: Chrome.

### responsive_design
- **Desktop-first** (o mockup Meus casos.png é desktop). Layout deve degradar de forma utilizável até ~tablet. Experiência mobile dedicada é o app Expo (fora do escopo desta rodada).
- **Sidebar master-detail (C2) responsiva:** abaixo de ~900px a sidebar de propostas **empilha no topo** (não é ocultada) — a feature precisa permanecer utilizável no estreito.

### performance_targets
- Grau-demo: listagens filtradas < ~1s no dataset de seed. Sem metas de produção (CDN, code-split agressivo) nesta rodada.

### accessibility_level
- Pragmático: HTML semântico nos novos componentes; modais com **foco preso, fechar via Esc e clique no backdrop**, e rótulos ARIA básicos — implementado via **primitiva de dialog existente**, sem construir acessibilidade do zero. Não há auditoria WCAG formal.

### Implementation Considerations
- Reuso obrigatório do `<Modal>` em todos os pontos de confirmação (zero window.confirm/alert ao final).
- Padrão de querystring de filtros compartilhado entre telas para consistência e reaproveitamento de hook.
- **Master-detail (C2): após mutação (aceitar/recusar proposta), refetch deve preservar o caso selecionado** — não recriar a lista de forma a perder a seleção atual.
- Upload: `multipart/form-data`; foto servida como estático, documento por endpoint autenticado (ver Domain Reqs).

> Seções `native_features` e `cli_commands` puladas conforme config do tipo web_app (não se aplicam).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**Abordagem:** Experience MVP incremental sobre produto existente — entregar o fluxo cliente↔advogado polido e os filtros que sustentam o "matching comparável", sem reescrever o que já funciona. Faseamento por **dependência técnica**, não por preferência: a fundação habilita o resto.
**Recursos:** equipe de 5 (MBA), **sem restrição de prazo** — prioriza-se qualidade e completude. Sugestão de frentes paralelas: 1–2 em backend/schema, 2 em front, 1 em integração/seed/testes de demo. Wave 0 é majoritariamente backend e bloqueia as demais.

### Onda 0 — Fundação (bloqueia tudo; fazer primeiro)
Enablers sem valor de tela isolado, mas pré-requisito de quase todos os itens:
- **#A6 (parte schema):** migrar `especializacao` String → relação **N:N de áreas** (tabela de áreas + join advogado↔área), com seed atualizado e leituras existentes corrigidas.
- **Campos novos de schema:** advogado (nota[seedada], estado/cidade de atuação, telefone, whatsapp, foto); cliente (foto, idade, endereço, telefones); processo (sem novo campo — "valor" usa proposta).
- **Storage de mídia:** util de upload (foto pública estática; documento por endpoint autenticado).
- **Privacidade backend:** DTOs de resposta com allowlist público vs. privado (cliente/advogado).
- **Front transversal:** componente `<Modal>` acessível + hook de filtro/paginação com envelope `{ data, total, page, pageSize }`.

### Onda 1 — Núcleo crítico da demo (espinha dorsal)
Depende da Onda 0. É a espinha dorsal da apresentação:
- **C2** sidebar master-detail de propostas (refetch preserva seleção; responsivo ~900px).
- **A1** tela "Meus Casos" do advogado (situação + detalhe + relatório).
- **C3** substituir window.confirm por `<Modal>` (cliente + conexões).
- **A6 (parte UI):** perfil do advogado editável com múltiplas áreas + botão de troca de plano.

### Onda 2 — Confiança & filtros
Depende dos campos da Onda 0 (nota/estado/região):
- **C4** Buscar Advogado: filtros nota + estado + vínculo.
- **A3** Oportunidades: filtros tempo de postagem + região.
- **C1** Meus Casos (cliente): filtros tipo/status/valor asc-desc.
- **A4** Oportunidades em blocos + filtro de quantidade (20/30/50/100).

### Onda 3 — Perfis ricos, contatos & cota
- **C6** Minha Conta (cliente): edição completa + privacidade visível (cadeado).
- **C5** Meus Advogados: contatos (email/telefone/whatsapp) com escopo de vínculo.
- **A5** Meus Clientes: filtro CPF/CNPJ/Nome.
- **A2** indicador de cota como número pequeno + modal de upgrade.

### Risk Mitigation Strategy (sem restrição de prazo)
- **Sem corte de escopo:** as 4 ondas serão entregues. O faseamento é por DEPENDÊNCIA técnica (Onda 0 habilita as demais), não por priorização de corte — busca-se a entrega completa e bem-feita.
- **Técnico (migração N:N):** maior risco; Onda 0 isolada como "walking skeleton", com seed reexecutável, validando que Oportunidades/Buscar/Perfis não quebraram antes de seguir.
- **Técnico (upload/privacidade):** foto pública vs. documento privado/autenticado; teste negativo de acesso de terceiro.
- **Qualidade > velocidade:** cada onda fecha com build limpo (front+back), smoke test do fluxo e aceite item a item antes da próxima.
- **Demo:** seed garante advogados multi-área, notas e estados variados — senão filtros aparecem vazios.

## Functional Requirements

> Contrato de capacidades — vinculante. O que não estiver aqui não vira tela, arquitetura ou story. FRs de capacidades já existentes (publicar caso, autenticação, criar proposta) não são relistados, EXCETO onde o comportamento muda nesta rodada (ex.: FR26 transição de estado).

### Gestão de Perfil e Áreas de Atuação
- FR1: Advogado pode cadastrar e manter MÚLTIPLAS áreas de atuação em seu perfil. [A6]
- FR2: Advogado pode editar seus dados de perfil (nome, OAB, áreas, estado/cidade de atuação). [A6]
- FR3: Advogado pode visualizar e solicitar troca do seu plano a partir do perfil. [A6]
- FR4: Cliente pode editar seus dados básicos de perfil (nome, idade, e-mail, documento). [C6]
- FR5: Cliente e Advogado podem enviar/alterar foto de perfil. [C6]
- FR6: Cliente pode cadastrar documentos pessoais (CPF/CNPJ) e dados de contato (endereço, telefones). [C6]
- FR7: O sistema distingue dados públicos de privados; endereço e telefones do dono nunca são expostos a terceiros. [C6 / privacidade]

### Descoberta e Seleção de Advogados (Cliente)
- FR8: Cliente pode buscar advogados filtrando por área de atuação. [C4 — existente, manter]
- FR9: Cliente pode filtrar advogados por nota (reputação). [C4]
- FR10: Cliente pode filtrar advogados por estado de atuação. [C4]
- FR11: Cliente pode filtrar advogados por vínculo (já vinculados / ainda não vinculados). [C4]
- FR12: Cliente pode visualizar os dados de contato (e-mail, telefone, WhatsApp) dos advogados aos quais está vinculado. [C5]

### Gestão de Casos e Propostas (Cliente)
- FR13: Cliente pode filtrar seus casos por tipo de processo. [C1]
- FR14: Cliente pode filtrar seus casos por status. [C1]
- FR15: Cliente pode ordenar seus casos/propostas por valor (crescente/decrescente). [C1]
- FR16: Cliente pode navegar seus casos em mestre-detalhe: a lista (sidebar) mostra OS CASOS DO CLIENTE; ao selecionar um caso, o detalhe mostra AS PROPOSTAS RECEBIDAS daquele caso. [C2]
- FR17: Cliente pode aceitar ou recusar uma proposta. [existente — manter, agora via modal]

> **Nota (rótulo vs. semântica):** no mockup `Meus casos.png` a sidebar aparece rotulada "PROPOSTAS ENVIADAS", mas a semântica correta (FR16) é que ela lista **os casos do cliente** (cada um com a contagem de propostas recebidas). O rótulo final da UI fica a critério do design; a estrutura de dados é caso → propostas recebidas.

### Oportunidades e Gestão de Casos (Advogado)
- FR18: Advogado pode visualizar oportunidades (casos abertos) das áreas em que atua. [A6/existente]
- FR19: Advogado pode filtrar oportunidades por tempo de postagem. [A3]
- FR20: Advogado pode filtrar oportunidades por região (estado/cidade). [A3]
- FR21: Advogado pode definir a quantidade de casos exibidos por página (20/30/50/100). [A4]
- FR22: Advogado pode visualizar oportunidades em layout de blocos. [A4]
- FR23: Advogado pode visualizar seus casos numa tela dedicada ("Meus Casos"), agrupados por situação (aberto / em atendimento / encerrado). [A1]
- FR24: Advogado pode abrir o detalhe de um caso seu e registrar/visualizar um relatório de situação. [A1]
- FR25: Advogado pode filtrar seus clientes por CPF/CNPJ ou nome. [A5]

### Ciclo de Vida do Caso
- FR26: Ao aceitar uma proposta, o sistema transiciona o caso de "aberto" para "em atendimento" automaticamente. [Jornada 1 — derivado de FR17]
- FR27: Tanto o Cliente (dono do caso) quanto o Advogado responsável podem encerrar um caso (transição para "encerrado"). [decisão: ambos]

### Cota de Propostas (Advogado)
- FR28: Advogado pode visualizar sua cota de propostas restantes do mês como indicador compacto. [A2]
- FR29: Advogado pode abrir o detalhe da cota e iniciar um upgrade de plano a partir dele. [A2/A6]
- FR30: O sistema impede o envio de proposta acima do limite do plano e informa o motivo. [existente — manter]
- FR31: O sistema efetiva a troca de plano solicitada pelo advogado, atualizando o plano vigente e refletindo o novo limite na cota de propostas. [A6/A2 — fecha a Jornada 4]

### Capacidades Transversais de Sistema
- FR32: O sistema apresenta confirmações e diálogos por meio de modais (não diálogos nativos do navegador). [C3]
- FR33: O sistema serve foto de perfil como mídia pública e documentos pessoais apenas ao seu dono autenticado. [C6 / privacidade]
- FR34: O sistema fornece listagens filtradas e paginadas para casos, oportunidades, advogados e clientes. [C1/C4/A3/A4/A5]
- FR35: O sistema mantém dados de demonstração (seed) que populam áreas múltiplas, notas e regiões para que todos os filtros tenham resultados. [Success Criteria]

## Non-Functional Requirements

### Segurança & Privacidade (categoria crítica deste lote)
- NFR1: Endereço e telefones marcados como privados NUNCA são retornados pela API a qualquer consumidor que não seja o próprio dono ou a plataforma. Verificável inspecionando a resposta no DevTools — o dado privado não consta no JSON.
- NFR2: Documentos pessoais (CPF/CNPJ/RG) só são acessíveis via endpoint autenticado do próprio dono; acesso por terceiro retorna 403. Foto de perfil pode ser pública.
- NFR3: Contatos de advogado (e-mail/telefone/WhatsApp) só são expostos a clientes efetivamente vinculados (registro em ClienteAdvogado); nunca em listagens públicas de busca.
- NFR4: Os DTOs de resposta de Cliente e Advogado usam allowlist de campos públicos — adicionar um campo sensível ao modelo não o expõe automaticamente.
- NFR5: Upload de arquivos restrito a tipos permitidos (jpg/png/pdf) e tamanho máximo (~5MB); arquivos fora da regra são rejeitados, com mensagem amigável comunicada no modal. Testável: subir .exe ou arquivo grande → rejeitado.

### Performance
- NFR6: Listagens filtradas e paginadas (casos, oportunidades, advogados, clientes) respondem em < ~1s no dataset de seed.
- NFR7: A filtragem e a ordenação ocorrem no backend; o cliente nunca baixa o conjunto completo para filtrar localmente.
- NFR8: A seleção de um caso no mestre-detalhe (C2) reflete as propostas sem recarregar a página.

### Acessibilidade (pragmática)
- NFR9: Modais são operáveis por teclado: foco preso enquanto abertos, Esc fecha, foco retorna ao gatilho ao fechar.
- NFR10: Componentes novos usam HTML semântico e rótulos ARIA básicos. (Sem meta de auditoria WCAG formal.)

### Compatibilidade
- NFR11: A aplicação funciona nas duas últimas versões de Chrome, Edge e Firefox. Sem suporte a navegadores legados/IE.

### Qualidade de Entrega (gate de "pronto")
- NFR12: Build de produção do front (`npm run build`) e build do backend passam sem erro antes de qualquer onda ser considerada concluída.
- NFR13: O seed é reexecutável (idempotente ou com reset) sem violar constraints.
- NFR14: Ao final do lote, há zero ocorrências de `window.confirm()`/`alert()` no código web.

> Categorias **Escalabilidade** e **Integração** deliberadamente omitidas — não se aplicam a esta rodada (projeto acadêmico, sem crescimento de carga nem integrações externas novas).
