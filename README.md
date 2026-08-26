# Kanban Board MVP (Scrum)

Quadro Kanban em tempo real, com sprints, tags, apontamento de horas (Play/Pause) e painel de atividades. Backend em NestJS (Clean Architecture), frontend em Next.js 14, PostgreSQL e Prisma.

---

## O que o produto faz

- Quadros, colunas e cards com arrastar e soltar
- Sprints (`PLANNED` / `ACTIVE` / `COMPLETED`) e filtro por sprint
- Tags (labels) no quadro e no card
- Horas planejadas vs executadas no card
- Cronômetro Play/Pause e lançamento manual (`TimeLog`)
- Feed de atividades (colapsável no quadro)
- Auth JWT (access + refresh) e atualização ao vivo via WebSocket

---

## Arquitetura (Clean Architecture)

Não há `Service` de feature. O HTTP chama o **use case**; o use case fala com **ports** do domínio; só o repositório toca o Prisma.

```text
Controller (presentation)
  → Use Case (application)          uma operação, método execute()
    → Port / repository interface   (domain)
      → Prisma repository           (infrastructure)
```

```
scrum/
├── backend/
│   ├── src/
│   │   ├── domain/                 # Entities, VOs, ports, DomainError
│   │   ├── application/
│   │   │   ├── interfaces/         # Ports de auth e realtime
│   │   │   └── use-cases/          # auth, boards, columns, cards, labels,
│   │   │                           # activities, sprints, timelogs
│   │   ├── infrastructure/         # Prisma, JWT, WebSockets, repos
│   │   └── presentation/           # Controllers, DTOs HTTP, filters
│   └── prisma/                     # schema, migrations, seed
├── frontend/
│   ├── src/
│   │   ├── app/                    # App Router: (auth), (dashboard)
│   │   ├── components/             # board, sprint, tags, activity, dnd
│   │   ├── stores/                 # Zustand (auth, board)
│   │   └── lib/                    # Axios + Socket.IO
│   └── cypress/e2e/                # auth, board, kanban-features
├── docker-compose.yml
└── .github/workflows/ci.yml
```

Use cases de sprint e horas (exemplos): `CreateSprintUseCase`, `StartTimeLogUseCase`, `StopTimeLogUseCase`, `AddManualTimeLogUseCase`. Prisma só em `infrastructure/repositories/`.

---

## Tecnologias

- **Backend:** Node.js 20, NestJS 10, TypeScript strict, Prisma, PostgreSQL 16, Socket.IO, Passport JWT, Jest, Supertest
- **Frontend:** Next.js 14, React 18, Tailwind, @dnd-kit, Zustand, Axios, Zod, Cypress 13
- **CI:** GitHub Actions + Docker Compose

---

## Como rodar

Pré-requisitos: Node.js ≥ 20, Docker Compose, npm.

### 1. Postgres

Na raiz `scrum/`:

```bash
docker compose up -d postgres
```

Porta **5434**.

### 2. Backend (porta 3001)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

- API: http://localhost:3001/api/v1
- Health: http://localhost:3001/api/v1/health
- Swagger: http://localhost:3001/api/docs

### 3. Frontend (porta 3000)

```bash
cd frontend
cat << 'EOF' > .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
EOF
npm install
npm run dev
```

App: http://localhost:3000 (home redireciona para `/login`).

### Contas do seed

| Email | Senha |
|---|---|
| `demo@kanban.dev` | `Demo1234!` |
| `demo@scrum.dev` | `password123` |
| `ana@kanban.dev` | `Demo1234!` |

O seed recria três boards do owner demo: **Produto MVP**, **Marketing Q3**, **Infra & DevOps** (cards, tags e sprints).

---

## Testes

### Backend

```bash
cd backend
npm test          # use cases com mock das ports
npm run test:e2e  # Supertest
npm run lint
```

### Frontend (Cypress)

Front em `:3000` e API em `:3001`.

```bash
cd frontend
npm run cypress        # UI
npm run cypress:run    # headless
```

| Spec | Cobre |
|---|---|
| `cypress/e2e/auth.cy.ts` | Login, validação, cadastro, credencial inválida |
| `cypress/e2e/board.cy.ts` | Criar board, coluna e card |
| `cypress/e2e/kanban-features.cy.ts` | Sprint, tag, horas, Play/Pause, busca, painel de atividades |

DnD não entra no Cypress (flaky). Comando auxiliar: `cy.seedKanban()`.

---

## Contrato da API (`/api/v1`)

Rotas autenticadas usam `Authorization: Bearer <accessToken>`. Envelope:

```json
{ "success": true, "data": {}, "meta": { "timestamp": "...", "requestId": "..." } }
```

Erro: `{ "success": false, "error": { "code", "message", "details" }, "meta" }`.

### Health
- `GET /health` — público

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Boards
- `GET /boards`
- `POST /boards` — cria também as colunas To Do / Doing / Done
- `GET /boards/:boardId`
- `PATCH /boards/:boardId`
- `DELETE /boards/:boardId`
- `POST /boards/:boardId/members`

### Columns
- `POST /boards/:boardId/columns`
- `PATCH /boards/:boardId/columns/:columnId`
- `DELETE /boards/:boardId/columns/:columnId`
- `PATCH /boards/:boardId/columns/reorder`

### Cards
- `POST /boards/:boardId/cards` — aceita `sprintId`, `estimatedHours`, `labelIds`
- `GET /boards/:boardId/cards` — filtros: `q`, `priority`, `labelId`, `assigneeId`, `sprintId`
- `PATCH /boards/:boardId/cards/:cardId`
- `DELETE /boards/:boardId/cards/:cardId`
- `POST /boards/:boardId/cards/:cardId/move`

### Labels (tags)
- `GET /boards/:boardId/labels`
- `POST /boards/:boardId/labels`
- `DELETE /boards/:boardId/labels/:labelId`

### Sprints
- `GET /boards/:boardId/sprints`
- `POST /boards/:boardId/sprints`
- `PATCH /boards/:boardId/sprints/:sprintId`
- `DELETE /boards/:boardId/sprints/:sprintId`

### TimeLogs (horas)
- `GET /boards/:boardId/cards/:cardId/timelogs`
- `POST /boards/:boardId/cards/:cardId/timelogs/start` — Play
- `POST /boards/:boardId/cards/:cardId/timelogs/:timeLogId/stop` — Pause
- `POST /boards/:boardId/cards/:cardId/timelogs/manual` — body `{ hours, description?, date? }`
- `DELETE /boards/:boardId/cards/:cardId/timelogs/:timeLogId`

### Activities
- `GET /boards/:boardId/activities?page=&perPage=`

### WebSockets (`/realtime`)

Sala `board:{boardId}`:

- `card:created`, `card:updated`, `card:moved`, `card:deleted`
- `column:created`, `column:updated`, `column:deleted`
- `activity:created`
