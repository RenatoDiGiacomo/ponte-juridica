# Ponte Jurídica

Marketplace que conecta clientes a advogados especializados.
**MBA Dev Full Stack — Impacta · Grupo 1**

> Pitch de 1 página: [PITCH.md](./PITCH.md)

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 10 + Prisma + MySQL 8 |
| Mobile | React Native (Expo SDK 51) + NativeWind |
| Auth | JWT |
| Infra | Docker Compose |

## Setup rápido

### 1. Pré-requisitos
- Docker Desktop em execução
- Node.js 18+
- Expo Go no celular (ou emulador Android/iOS)

### 2. Banco de dados

```bash
docker-compose up -d
```

Sobe MySQL na porta `3306` e Adminer em `http://localhost:8080`.

### 3. Backend

```bash
cd backend
cp .env.example .env        # já vem configurado para o Docker local
npm install
npx prisma migrate dev      # cria as tabelas
npm run seed                # popula dados de demo
npm run start:dev           # API em http://localhost:3333
```

Swagger interativo: **http://localhost:3333/api**

### 4. Mobile

```bash
cd mobile
npm install
npx expo start
```

Escanear o QR com o Expo Go ou pressionar `a` para abrir no emulador Android.

## Credenciais de demo

Senha de todos: **`senha123`**

| Perfil | E-mail | Plano | Para mostrar |
|---|---|---|---|
| Cliente | `cliente.demo@pontejuridica.com` | — | recebe propostas, aceita uma |
| Cliente | `mariana@pontejuridica.com` | — | tem caso de Família com proposta |
| Advogado | `maria.demo@pontejuridica.com` | Profissional | trabalhista, vê 20/mês |
| Advogado | `juliana@pontejuridica.com` | **Básico** | cível, limite 5/mês |
| Advogado | `carlos@pontejuridica.com` | **Elite** | criminal, ilimitado |

## Roteiro de demo (5 min)

1. **Login como cliente** (`cliente.demo`) → tab **Casos** mostra:
   - 1 caso "em atendimento" (proposta já aceita)
   - 1 caso aberto com propostas pendentes (badge na tab)
2. Toca **+** → publica novo caso "Trabalhista"
3. Sai da conta (tab **Conta** → Sair)
4. **Login como advogado trabalhista** (`maria.demo`) → tab **Oportunidades**:
   - banner do plano mostra `X / 20 propostas usadas neste mês`
   - vê o caso novo no topo do feed
5. Abre o caso → envia proposta com mensagem e valor
6. Sai da conta, volta ao cliente
7. Tab **Casos** → puxa pra atualizar → vê a proposta nova → **Aceitar**
8. Vínculo criado automaticamente: aparece em **Vinculados** do cliente E em **Clientes** do advogado

**Bônus:** loga como `juliana@pontejuridica.com` (Básico) pra mostrar o banner em vermelho/âmbar quando o limite mensal apertar — argumento de upsell para o Profissional/Elite.

## Endpoints principais

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

## Estrutura

```
/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/         # Login, registro, JWT, /me
│   │   ├── advogados/    # Listagem e perfis
│   │   ├── planos/       # Planos de assinatura
│   │   ├── conexoes/     # Vínculos cliente-advogado
│   │   ├── processos/    # Casos + propostas + quota
│   │   ├── prisma/
│   │   └── common/       # Guards, decorators
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── mobile/           # React Native (Expo)
│   └── src/
│       ├── screens/      # auth | cliente | advogado
│       ├── hooks/        # usePropostasPendentes etc
│       ├── services/     # api.ts (axios)
│       └── contexts/     # AuthContext
├── docker-compose.yml
├── PITCH.md          # narrativa de 1 página
└── Documentos/       # docs do MBA
```

## User Stories da Sprint 01

| ID | História | Status |
|----|----------|--------|
| US-01 | Cadastro do Solicitante | ✅ |
| US-02 | Criação de Post de Processo | ✅ |
| US-03 | Cadastro do Advogado (com plano) | ✅ |
| US-04 | Listagem de Processos para Advogado | ✅ |
| US-05 | Sistema de Taxas/Limites por plano | ✅ (limite mensal de propostas) |

## Convenções

- Soft delete obrigatório — nunca deletar registros fisicamente
- Commits em português com Conventional Commits
- Branches: `main` (produção), `feat/<nome>` (features)

## Equipe

| Nome | Papel |
|------|-------|
| Rafael Mattiuzzo | Dev — back + front + infra |
| Ricardo Matos | Scrum Master |
| Renato Di Giacomo | Product Owner |
| Alexandre Borges | Dev |
| Leandro | Dev — frontend / UX |
