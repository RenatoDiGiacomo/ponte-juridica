# Ponte Jurídica

Marketplace jurídico que conecta clientes a advogados especializados.
**MBA Dev Full Stack — Impacta | Grupo 1**

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 10 + Prisma + MySQL |
| Mobile | React Native (Expo) + NativeWind (Tailwind) |
| Auth | JWT |
| Infra | Docker Compose |

## Setup rápido

### 1. Pré-requisitos
- Node.js 18+
- Docker Desktop
- Expo Go no celular (ou emulador Android)

### 2. Banco de dados

```bash
docker-compose up -d
```

Isso sobe o MySQL na porta `3306` e o Adminer em `http://localhost:8080`.

### 3. Backend

```bash
cd backend
cp .env.example .env        # já vem configurado para o Docker local
npm install
npm run db:migrate          # cria as tabelas via Prisma
npm run seed                # cria dados demo
npm run start:dev           # API em http://localhost:3333
```

Swagger disponível em: `http://localhost:3333/api/docs`

### 4. Mobile

```bash
cd mobile
npm install
npx expo start
```

Escanear o QR Code com o Expo Go no celular, ou pressionar `a` para abrir no emulador Android.

## Usuários demo (após seed)

| Tipo | E-mail | Senha |
|------|--------|-------|
| Advogado | maria.demo@pontejuridica.com | senha123 |
| Cliente | cliente.demo@pontejuridica.com | senha123 |

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/cliente/registro` | Cadastrar cliente |
| POST | `/api/v1/auth/cliente/login` | Login cliente |
| POST | `/api/v1/auth/advogado/registro` | Cadastrar advogado |
| POST | `/api/v1/auth/advogado/login` | Login advogado |
| GET | `/api/v1/advogados` | Listar advogados (filtro por especialização) |
| GET | `/api/v1/advogados/:id` | Perfil público do advogado |
| GET | `/api/v1/planos` | Listar planos |
| POST | `/api/v1/conexoes/:advogadoId` | Cliente solicita vínculo |
| GET | `/api/v1/conexoes` | Meus vínculos |

## Estrutura do projeto

```
/
├── backend/
│   ├── src/
│   │   ├── auth/           # Login, registro, JWT
│   │   ├── advogados/      # Listagem e perfis
│   │   ├── planos/         # Planos de assinatura
│   │   ├── conexoes/       # Vínculos cliente-advogado
│   │   ├── prisma/         # Serviço do banco
│   │   └── common/         # Guards, decorators
│   └── prisma/
│       ├── schema.prisma   # Modelo de dados
│       └── seed.ts         # Dados iniciais
├── mobile/
│   └── src/
│       ├── screens/        # Telas (auth, cliente, advogado)
│       ├── services/       # Chamadas à API
│       └── contexts/       # Estado global (auth)
├── docker-compose.yml
└── Documentos/             # Docs do MBA
```

## Convenções

- Soft delete obrigatório — nunca deletar registros fisicamente
- Commits em português com Conventional Commits
- Branches: `main` (produção), `feat/<nome>` (features)
