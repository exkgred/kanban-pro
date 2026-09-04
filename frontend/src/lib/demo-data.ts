import {
  BoardVisibility,
  CardPriority,
  SprintStatus,
  type Activity,
  type Board,
  type Card,
  type Column,
  type Label,
  type Sprint,
  type User,
} from '../types';

const now = new Date().toISOString();

export const demoUser: User = {
  id: 'user-marina',
  name: 'Marina Alves',
  email: 'demo@kanban.dev',
  createdAt: now,
  updatedAt: now,
};

export const demoBoards: Board[] = [
  {
    id: 'board-produto',
    title: 'Produto MVP',
    description: 'Entrega do Kanban: sprints, tags e apontamento de horas',
    visibility: BoardVisibility.PRIVATE,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'board-marketing',
    title: 'Marketing Q3',
    description: 'Campanhas, conteúdo e landing pages',
    visibility: BoardVisibility.WORKSPACE,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'board-infra',
    title: 'Infra & DevOps',
    description: 'CI, observabilidade e ambientes',
    visibility: BoardVisibility.PRIVATE,
    createdAt: now,
    updatedAt: now,
  },
];

export const demoColumns: Record<string, Column[]> = {
  'board-produto': [
    { id: 'col-backlog', boardId: 'board-produto', title: 'Backlog', position: 0, createdAt: now, updatedAt: now },
    { id: 'col-todo', boardId: 'board-produto', title: 'To Do', position: 1, createdAt: now, updatedAt: now },
    { id: 'col-doing', boardId: 'board-produto', title: 'Doing', position: 2, createdAt: now, updatedAt: now },
    { id: 'col-review', boardId: 'board-produto', title: 'Review', position: 3, createdAt: now, updatedAt: now },
    { id: 'col-done', boardId: 'board-produto', title: 'Done', position: 4, createdAt: now, updatedAt: now },
  ],
  'board-marketing': [
    { id: 'mkt-ideas', boardId: 'board-marketing', title: 'Ideias', position: 0, createdAt: now, updatedAt: now },
    { id: 'mkt-doing', boardId: 'board-marketing', title: 'Em produção', position: 1, createdAt: now, updatedAt: now },
    { id: 'mkt-done', boardId: 'board-marketing', title: 'Publicado', position: 2, createdAt: now, updatedAt: now },
  ],
  'board-infra': [
    { id: 'ops-todo', boardId: 'board-infra', title: 'To Do', position: 0, createdAt: now, updatedAt: now },
    { id: 'ops-doing', boardId: 'board-infra', title: 'Doing', position: 1, createdAt: now, updatedAt: now },
    { id: 'ops-done', boardId: 'board-infra', title: 'Done', position: 2, createdAt: now, updatedAt: now },
  ],
};

export const demoLabels: Record<string, Label[]> = {
  'board-produto': [
    { id: 'lb-bug', boardId: 'board-produto', name: 'bug', color: '#ef4444' },
    { id: 'lb-feat', boardId: 'board-produto', name: 'feature', color: '#22c55e' },
    { id: 'lb-front', boardId: 'board-produto', name: 'frontend', color: '#8b5cf6' },
    { id: 'lb-back', boardId: 'board-produto', name: 'backend', color: '#0ea5e9' },
    { id: 'lb-urg', boardId: 'board-produto', name: 'urgente', color: '#f97316' },
  ],
  'board-marketing': [
    { id: 'lb-social', boardId: 'board-marketing', name: 'social', color: '#ec4899' },
    { id: 'lb-ads', boardId: 'board-marketing', name: 'ads', color: '#f59e0b' },
  ],
  'board-infra': [
    { id: 'lb-ci', boardId: 'board-infra', name: 'ci', color: '#0ea5e9' },
    { id: 'lb-sec', boardId: 'board-infra', name: 'segurança', color: '#ef4444' },
  ],
};

export const demoSprints: Record<string, Sprint[]> = {
  'board-produto': [
    {
      id: 'sp-10', boardId: 'board-produto', name: 'Sprint 10 — Fundação',
      status: SprintStatus.COMPLETED, startDate: null, endDate: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'sp-11', boardId: 'board-produto', name: 'Sprint 11 — Kanban ao vivo',
      status: SprintStatus.ACTIVE, startDate: null, endDate: null, createdAt: now, updatedAt: now,
    },
    {
      id: 'sp-12', boardId: 'board-produto', name: 'Sprint 12 — Relatórios',
      status: SprintStatus.PLANNED, startDate: null, endDate: null, createdAt: now, updatedAt: now,
    },
  ],
  'board-marketing': [],
  'board-infra': [],
};

function card(
  id: string,
  boardId: string,
  columnId: string,
  title: string,
  extras: Partial<Card> = {},
): Card {
  return {
    id,
    boardId,
    columnId,
    title,
    description: extras.description ?? '',
    priority: extras.priority ?? CardPriority.MEDIUM,
    position: extras.position ?? 0,
    createdAt: now,
    updatedAt: now,
    labels: extras.labels ?? [],
    sprintId: extras.sprintId ?? 'sp-11',
    sprint: extras.sprint ?? { id: 'sp-11', name: 'Sprint 11 — Kanban ao vivo', status: 'ACTIVE' },
    estimatedHours: extras.estimatedHours ?? 4,
    executedHours: extras.executedHours ?? 1,
    ...extras,
  };
}

export const demoCards: Record<string, Card[]> = {
  'board-produto': [
    card('c-1', 'board-produto', 'col-backlog', 'Exportar quadro em CSV', {
      position: 0, priority: CardPriority.LOW, labels: [demoLabels['board-produto'][1]], estimatedHours: 6, executedHours: 0,
    }),
    card('c-2', 'board-produto', 'col-todo', 'Filtro por responsável no quadro', {
      position: 0, labels: [demoLabels['board-produto'][2]], estimatedHours: 5, executedHours: 0,
    }),
    card('c-3', 'board-produto', 'col-todo', 'Atalhos de teclado no card', {
      position: 1, priority: CardPriority.LOW, labels: [demoLabels['board-produto'][2]],
    }),
    card('c-4', 'board-produto', 'col-doing', 'Play/Pause de horas no card', {
      position: 0, priority: CardPriority.HIGH, labels: [demoLabels['board-produto'][3], demoLabels['board-produto'][2]],
      estimatedHours: 8, executedHours: 3.5,
      description: 'Cronômetro persistido e lançamento manual de horas.',
    }),
    card('c-5', 'board-produto', 'col-doing', 'WebSocket ao mover card', {
      position: 1, priority: CardPriority.HIGH, labels: [demoLabels['board-produto'][3]],
      estimatedHours: 6, executedHours: 4,
    }),
    card('c-6', 'board-produto', 'col-review', 'Tags coloridas no card', {
      position: 0, labels: [demoLabels['board-produto'][2], demoLabels['board-produto'][1]],
      estimatedHours: 3, executedHours: 3,
    }),
    card('c-7', 'board-produto', 'col-done', 'Login JWT e refresh token', {
      position: 0, priority: CardPriority.HIGH, labels: [demoLabels['board-produto'][3]],
      estimatedHours: 8, executedHours: 8, sprintId: 'sp-10',
      sprint: { id: 'sp-10', name: 'Sprint 10 — Fundação', status: 'COMPLETED' },
    }),
    card('c-8', 'board-produto', 'col-done', 'Colunas To Do / Doing / Done no create', {
      position: 1, labels: [demoLabels['board-produto'][3]],
      estimatedHours: 2, executedHours: 2, sprintId: 'sp-10',
      sprint: { id: 'sp-10', name: 'Sprint 10 — Fundação', status: 'COMPLETED' },
    }),
  ],
  'board-marketing': [
    card('m-1', 'board-marketing', 'mkt-ideas', 'Série de posts sobre o Kanban', {
      position: 0, sprintId: null, sprint: null, labels: [demoLabels['board-marketing'][0]],
    }),
    card('m-2', 'board-marketing', 'mkt-doing', 'Landing da demo no Vercel', {
      position: 0, priority: CardPriority.HIGH, sprintId: null, sprint: null, labels: [demoLabels['board-marketing'][1]],
    }),
    card('m-3', 'board-marketing', 'mkt-done', 'Identidade visual violeta', {
      position: 0, sprintId: null, sprint: null,
    }),
  ],
  'board-infra': [
    card('i-1', 'board-infra', 'ops-todo', 'Pipeline de preview na Vercel', {
      position: 0, sprintId: null, sprint: null, labels: [demoLabels['board-infra'][0]],
    }),
    card('i-2', 'board-infra', 'ops-doing', 'Alertas de health check', {
      position: 0, priority: CardPriority.HIGH, sprintId: null, sprint: null, labels: [demoLabels['board-infra'][1]],
    }),
    card('i-3', 'board-infra', 'ops-done', 'Docker Compose local', {
      position: 0, sprintId: null, sprint: null, labels: [demoLabels['board-infra'][0]],
    }),
  ],
};

export const demoActivities: Record<string, Activity[]> = {
  'board-produto': [
    { id: 'a-1', boardId: 'board-produto', type: 'card.moved', description: 'Marina moveu "Play/Pause de horas no card" para Doing', userId: 'user-marina', createdAt: now },
    { id: 'a-2', boardId: 'board-produto', type: 'card.created', description: 'Marina criou "Filtro por responsável no quadro"', userId: 'user-marina', createdAt: now },
  ],
  'board-marketing': [],
  'board-infra': [],
};
