# Ponte Jurídica

Marketplace que conecta clientes a advogados especializados.
**MBA Dev Full Stack — Impacta · Grupo 1**

> Pitch de 1 página: [PITCH.md](./PITCH.md)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 10 + Prisma + MySQL 8 |
| Web | React 19 + Vite + Tailwind 4 |
| Mobile | React Native (Expo SDK 54) + NativeWind |
| Auth | JWT |
| Infra | Docker Compose |

---

## Setup rápido (web — recomendado para os colegas)

### 1. Pré-requisitos

- **Docker Desktop** instalado e em execução
- **Node.js 18+**
- **Git**

> Verifique: `docker --version`, `node --version`, `git --version`

### 2. Clonar o repositório

```bash
git clone https://github.com/mattiuzzo/ponte-juridica.git
cd ponte-juridica
```

### 3. Subir o banco

```bash
docker-compose up -d
```

Sobe o MySQL na porta `3306` e o Adminer (visualizador de banco) em `http://localhost:8080`.

> Se a porta 3306 estiver ocupada por algum MySQL local, pare-o antes (`net stop MySQL` no Windows ou `sudo service mysql stop` no Linux).

### 4. Backend

```bash
cd backend
npm install
```

Copiar o arquivo de variáveis (já vem configurado pra Docker local):

| Sistema | Comando |
|---------|---------|
| Windows (PowerShell) | `Copy-Item .env.example .env` |
| Mac / Linux / Git Bash | `cp .env.example .env` |

Depois:

```bash
npx prisma migrate dev      # cria as tabelas
npm run seed                # popula dados de demo
npm run start:dev           # API em http://localhost:3333
```

> **Mantenha esse terminal aberto.** Abra outro terminal pro próximo passo.
> 🔄 **Recarregar a base de demo do zero** (dados ricos: avaliações, propostas canceladas, encerramentos com motivo): pare a API e rode `npx prisma migrate reset --force`.

### 5. Web

```bash
cd web
npm install
npm run dev                 # http://localhost:5173
```

Abra **http://localhost:5173** no navegador. Pronto.

---

## Verificação rápida

Tudo certo se essas 3 URLs respondem:

| URL | O que esperar |
|-----|---------------|
| http://localhost:5173 | Tela de login da Ponte Jurídica |
| http://localhost:3333/api | Documentação interativa do Swagger |
| http://localhost:8080 | Adminer (servidor `db`, usuário `root`, senha `pontejuridica`, banco `ponte_juridica`) |

---

## Credenciais de demo

**Senha de todos: `senha123`**

Na tela de login há **atalhos clicáveis** pra cada perfil — não precisa digitar nada. Funciona igual no web e no mobile.

| Perfil | E-mail | Plano | Pra mostrar |
|---|---|---|---|
| Cliente | `cliente.demo@pontejuridica.com` | — | casos em atendimento/encerrado, propostas pendentes, **1 proposta cancelada** e **contatos** |
| Cliente | `mariana.demo@pontejuridica.com` | — | casos de Família e Cível |
| Advogado | `maria.demo@pontejuridica.com` | Profissional | Trabalhista · **Painel rico** (34 propostas, R$58k), 12 clientes |
| Advogado | `juliana.demo@pontejuridica.com` | **Básico** | Cível · limite 5/mês (upsell) |
| Advogado | `carlos.demo@pontejuridica.com` | **Elite** | Criminal · ilimitado |

> São as **5 contas estáveis** do seed (sempre com esses e-mails). Os demais ~78 advogados/148 clientes têm e-mail aleatório a cada reseed.

---

## Destaques para a apresentação (pontos de "uau")

- **Painel do advogado** — KPIs + **gráfico de barras mensal** (enviadas × aceitas) com **navegação por Ano/Mês** (setas). Loga como `maria.demo` e abre direto no Painel.
- **Avaliações reais** — cliente avalia o advogado em caso encerrado (estrelas + comentário); a **nota** do advogado é a média real.
- **Notificações** — sino no topo (proposta aceita, novo relatório, nova avaliação…).
- **Editar / cancelar proposta** — advogado gerencia a própria proposta; cancelar exige **justificativa exibida ao cliente**.
- **Encerrar caso com justificativa** — motivo aparece pro cliente.
- **Checkout simulado** de plano + **recuperação de senha** (fluxo em 2 passos).
- **Mobile em paridade** — mesmo fluxo no app (Expo), incl. Painel do advogado, uploads de foto/documento e onboarding.

## Roteiro de demo (~6 min)

1. **Advogado** (`maria.demo`) → cai no **Painel**: mostre os KPIs, o **gráfico** e a **navegação por mês/ano**.
2. **Oportunidades** → um caso com **card verde "proposta enviada"**: abra, **edite** e mostre o **cancelar com justificativa**. Em outro caso, **Enviar proposta**.
3. **Meus Casos** → abra um caso "em atendimento": registre um **relatório**; **encerre** informando a **justificativa**.
4. **Sair** (canto superior direito).
5. **Cliente** (`cliente.demo`) → **Meus Casos**: veja a proposta recém-enviada e **Aceite** (cria o vínculo). Mostre também a **proposta cancelada** (com o motivo) e um caso **encerrado com o motivo**.
6. Num caso **encerrado**, clique **⭐ Avaliar o advogado** (estrelas + comentário).
7. **Encontrar Advogado** → busque **por nome**, filtre **áreas** (multiseleção). Solicite contato → aparece em **Meus Contatos**.
8. Toque no **🔔 sino** pra mostrar as notificações geradas no caminho.

**Bônus:** `juliana.demo` (Básico) → banner de cota em vermelho/âmbar = **upsell** pro Profissional/Elite (clique em Gerenciar plano → **checkout simulado**). E o **"Esqueci minha senha"** no login.

---

## Mobile (opcional)

O mesmo fluxo está implementado em React Native com Expo. Útil pra mostrar a versão app.

```bash
cd mobile
npm install
npx expo start -c     # -c limpa o cache do Metro (use sempre após npm install)
```

Opções de uso após rodar:

- **`w`** → abre no navegador (versão web do React Native)
- **`a`** → abre no emulador Android (precisa Android Studio)
- **QR code** → abre no celular real via app **Expo Go** (Play Store / App Store)

> ⚠️ Pra testar **no celular real**, ele precisa estar na **mesma rede Wi-Fi** do computador. O Expo cuida do resto.
> 💡 Se o app **não abrir** ou der "unable to resolve module", rode `npx expo install --fix` e depois `npx expo start -c`.
> Os **atalhos de login demo** funcionam igual no app.

---

## Atualizar depois de `git pull`

Sempre que puxar mudanças novas:

```bash
git pull

# se mudou o schema do banco
cd backend && npx prisma migrate dev

# se mudou package.json
cd backend && npm install
cd ../web && npm install
cd ../mobile && npm install
```

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `Error: connect ECONNREFUSED 3306` | MySQL não subiu | `docker-compose up -d` e aguarde 5s |
| Porta 3306 ocupada ao subir Docker | MySQL local rodando | Pare o MySQL local ou troque a porta no `docker-compose.yml` |
| `npm install` muito lento | Conexão lenta | Use `npm ci` que é mais rápido com `package-lock.json` |
| Web abre mas tela em branco | Backend caiu | Confira se `npm run start:dev` ainda está rodando |
| `prisma migrate dev` reclama de banco | Banco não inicializou | `docker-compose down -v && docker-compose up -d` (apaga e recria) |
| Erro 401 em chamadas após muito tempo | JWT expirou | Saia e logue de novo |
| Mobile no celular não conecta | Wi-Fi diferente OU firewall | Mesmo Wi-Fi + libere porta 3333 no firewall |

---

## Endpoints principais

Documentação completa interativa: **http://localhost:3333/api**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/{cliente|advogado}/registro` | Cadastro |
| POST | `/api/v1/auth/{cliente|advogado}/login` | Login |
| GET | `/api/v1/auth/me` | Dados do usuário logado |
| GET | `/api/v1/advogados` | Listar advogados (filtro por especialização) |
| GET | `/api/v1/planos` | Listar planos |
| POST | `/api/v1/processos` | Cliente publica caso |
| GET | `/api/v1/processos` | Advogado lista casos abertos da sua área |
| GET | `/api/v1/processos/meus` | Cliente: meus casos + propostas |
| POST | `/api/v1/processos/:id/propostas` | Advogado envia proposta |
| PATCH | `/api/v1/propostas/:id/aceitar` | Cliente aceita (cria vínculo) |
| PATCH | `/api/v1/propostas/:id/recusar` | Cliente recusa |
| GET | `/api/v1/propostas/quota` | Quota mensal do plano do advogado |
| POST | `/api/v1/conexoes/:advogadoId` | Cliente solicita vínculo direto |

---

## Estrutura

```
/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/         # Login, registro, JWT, /me
│   │   ├── advogados/    # Listagem e perfis
│   │   ├── planos/       # Planos de assinatura
│   │   ├── conexoes/     # Vínculos cliente-advogado
│   │   ├── processos/    # Casos + propostas + quota mensal
│   │   ├── prisma/
│   │   └── common/       # Guards, decorators
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── web/              # React + Vite + Tailwind 4
│   └── src/
│       ├── pages/        # auth | cliente | advogado
│       ├── components/   # Navbar etc
│       ├── hooks/
│       ├── services/
│       └── contexts/
├── mobile/           # React Native (Expo)
│   └── src/
│       ├── screens/
│       ├── hooks/
│       ├── services/
│       └── contexts/
├── docker-compose.yml
├── PITCH.md          # narrativa de 1 página
└── Documentos/       # docs do MBA
```

---

## User Stories da Sprint 01

| ID | História | Status |
|----|----------|--------|
| US-01 | Cadastro do Solicitante | ✅ |
| US-02 | Criação de Post de Processo | ✅ |
| US-03 | Cadastro do Advogado (com plano) | ✅ |
| US-04 | Listagem de Processos para Advogado | ✅ |
| US-05 | Sistema de Taxas/Limites por plano | ✅ (limite mensal de propostas) |

---

## Convenções

- Soft delete obrigatório — nunca deletar registros fisicamente
- Commits em português com Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Branch padrão: `main`. Features em `feat/<nome>`
- API responde sempre em português

---

## Equipe

| Nome | Papel |
|------|-------|
| Rafael Mattiuzzo | Dev — back + front + infra |
| Ricardo Matos | Scrum Master |
| Renato Di Giacomo | Product Owner |
| Alexandre Borges | Dev |
| Leandro | Dev — frontend / UX |
