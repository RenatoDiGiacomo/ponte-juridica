# Ponte Jurídica

Plataforma de conexão entre clientes e advogados. Projeto do MBA Dev Full Stack — Impacta.

## Contexto de negócio

Marketplace jurídico que conecta pessoas que precisam de assistência jurídica com advogados especializados. Advogados assinam planos mensais/anuais para aparecer na plataforma; clientes buscam e se vinculam a advogados por área de especialização.

## Stack definida

- **Banco:** MySQL — `ponte_juridica` (já modelado, ver `Documentos/ProjetoDev/SQL - TABELAS.sql`)
- **Backend:** (definir — Java Spring Boot? Node.js? .NET?)
- **Frontend:** (definir)

## Modelo de dados

| Tabela | Descrição |
|--------|-----------|
| `plano` | Planos de assinatura (mensal/anual) |
| `cliente` | Pessoas que buscam atendimento jurídico |
| `adv` | Advogados com OAB e especialização |
| `cliente_advogado` | Vínculo/processo entre cliente e advogado |

Todas as tabelas usam `soft_delete BOOLEAN` — nunca deletar registros fisicamente.

## Sprints

- Sprint 01–04 concluídos (ver `Documentos/Sprints/`)
- Sprints em andamento: (atualizar)

## Documentos importantes

- `Documentos/Projeto Ponte Juridica.docx` — documento principal do projeto
- `Documentos/ProjetoDev/SQL - TABELAS.sql` — DDL completo
- `Documentos/Sprints/` — histórico de sprints
- `Marca/Brand Guide — Ponte Jurídica.pdf` — identidade visual

## Convenções

- Soft delete obrigatório em todas as entidades — nunca `DELETE` físico
- Commits em português, Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- (adicionar mais conforme o projeto evoluir)

## Integrantes do grupo

- Rafael Mattiuzzo
- (adicionar demais)
