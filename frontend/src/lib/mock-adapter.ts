import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
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
  type TimeLog,
  type User,
} from '../types';
import {
  demoActivities,
  demoBoards,
  demoCards,
  demoColumns,
  demoLabels,
  demoSprints,
  demoUser,
} from './demo-data';

const STORAGE_KEY = 'kanban-demo-state';

interface DemoState {
  user: User;
  boards: Board[];
  columns: Record<string, Column[]>;
  cards: Record<string, Card[]>;
  labels: Record<string, Label[]>;
  sprints: Record<string, Sprint[]>;
  activities: Record<string, Activity[]>;
  timelogs: Record<string, TimeLog[]>;
}

function seed(): DemoState {
  return {
    user: { ...demoUser },
    boards: demoBoards.map((b) => ({ ...b })),
    columns: JSON.parse(JSON.stringify(demoColumns)) as DemoState['columns'],
    cards: JSON.parse(JSON.stringify(demoCards)) as DemoState['cards'],
    labels: JSON.parse(JSON.stringify(demoLabels)) as DemoState['labels'],
    sprints: JSON.parse(JSON.stringify(demoSprints)) as DemoState['sprints'],
    activities: JSON.parse(JSON.stringify(demoActivities)) as DemoState['activities'],
    timelogs: {},
  };
}

function load(): DemoState {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* ignore */
  }
  return seed();
}

function save(state: DemoState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ok<T>(data: T) {
  return { success: true, data, meta: { timestamp: new Date().toISOString(), requestId: 'demo' } };
}

function fail(message: string, status = 400): never {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  throw error;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  if (!config.data) return {};
  return typeof config.data === 'string' ? JSON.parse(config.data) : (config.data as Record<string, unknown>);
}

function pathOf(config: InternalAxiosRequestConfig): string {
  const raw = config.url || '';
  return raw.split('?')[0].replace(/\/$/, '');
}

function handle(config: InternalAxiosRequestConfig): unknown {
  const state = load();
  const method = (config.method || 'get').toUpperCase();
  const path = pathOf(config);
  const body = parseBody(config);
  const now = new Date().toISOString();

  if (path === '/auth/login' && method === 'POST') {
    return ok({
      user: state.user,
      tokens: { accessToken: 'demo-access', refreshToken: 'demo-refresh' },
    });
  }
  if (path === '/auth/register' && method === 'POST') {
    state.user = {
      ...state.user,
      name: String(body.name || state.user.name),
      email: String(body.email || state.user.email),
    };
    save(state);
    return ok({
      user: state.user,
      tokens: { accessToken: 'demo-access', refreshToken: 'demo-refresh' },
    });
  }
  if (path === '/auth/logout' && method === 'POST') return ok({ ok: true });
  if (path === '/auth/refresh' && method === 'POST') {
    return ok({ accessToken: 'demo-access', refreshToken: 'demo-refresh' });
  }
  if (path === '/auth/me' && method === 'GET') return ok(state.user);

  if (path === '/boards' && method === 'GET') return ok(state.boards);
  if (path === '/boards' && method === 'POST') {
    const board: Board = {
      id: uid('board'),
      title: String(body.title || 'Novo board'),
      description: body.description ? String(body.description) : '',
      visibility: (body.visibility as Board['visibility']) || BoardVisibility.PRIVATE,
      createdAt: now,
      updatedAt: now,
    };
    state.boards.unshift(board);
    state.columns[board.id] = [
      { id: uid('col'), boardId: board.id, title: 'To Do', position: 0, createdAt: now, updatedAt: now },
      { id: uid('col'), boardId: board.id, title: 'Doing', position: 1, createdAt: now, updatedAt: now },
      { id: uid('col'), boardId: board.id, title: 'Done', position: 2, createdAt: now, updatedAt: now },
    ];
    state.cards[board.id] = [];
    state.labels[board.id] = [];
    state.sprints[board.id] = [];
    state.activities[board.id] = [];
    save(state);
    return ok(board);
  }

  const boardGet = path.match(/^\/boards\/([^/]+)$/);
  if (boardGet && method === 'GET') {
    const board = state.boards.find((b) => b.id === boardGet[1]);
    if (!board) fail('Board não encontrado', 404);
    return ok({ ...board, columns: state.columns[board.id] || [] });
  }
  if (boardGet && method === 'PATCH') {
    const board = state.boards.find((b) => b.id === boardGet[1]);
    if (!board) fail('Board não encontrado', 404);
    Object.assign(board, body, { updatedAt: now });
    save(state);
    return ok(board);
  }
  if (boardGet && method === 'DELETE') {
    state.boards = state.boards.filter((b) => b.id !== boardGet[1]);
    save(state);
    return ok({ ok: true });
  }

  const cardsList = path.match(/^\/boards\/([^/]+)\/cards$/);
  if (cardsList && method === 'GET') return ok(state.cards[cardsList[1]] || []);
  if (cardsList && method === 'POST') {
    const boardId = cardsList[1];
    const card: Card = {
      id: uid('card'),
      boardId,
      columnId: String(body.columnId),
      title: String(body.title || 'Card'),
      description: body.description ? String(body.description) : '',
      priority: (body.priority as Card['priority']) || CardPriority.MEDIUM,
      position: (state.cards[boardId] || []).length,
      createdAt: now,
      updatedAt: now,
      labels: [],
      sprintId: body.sprintId ? String(body.sprintId) : null,
      estimatedHours: body.estimatedHours != null ? Number(body.estimatedHours) : 0,
      executedHours: 0,
    };
    state.cards[boardId] = [...(state.cards[boardId] || []), card];
    save(state);
    return ok(card);
  }

  const cardItem = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)$/);
  if (cardItem && method === 'PATCH') {
    const list = state.cards[cardItem[1]] || [];
    const card = list.find((c) => c.id === cardItem[2]);
    if (!card) fail('Card não encontrado', 404);
    Object.assign(card, body, { updatedAt: now });
    save(state);
    return ok(card);
  }
  if (cardItem && method === 'DELETE') {
    state.cards[cardItem[1]] = (state.cards[cardItem[1]] || []).filter((c) => c.id !== cardItem[2]);
    save(state);
    return ok({ ok: true });
  }

  const cardMove = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)\/move$/);
  if (cardMove && method === 'POST') {
    const card = (state.cards[cardMove[1]] || []).find((c) => c.id === cardMove[2]);
    if (!card) fail('Card não encontrado', 404);
    card.columnId = String(body.columnId || card.columnId);
    card.position = Number(body.position ?? card.position);
    card.updatedAt = now;
    save(state);
    return ok(card);
  }

  const cols = path.match(/^\/boards\/([^/]+)\/columns$/);
  if (cols && method === 'POST') {
    const boardId = cols[1];
    const column: Column = {
      id: uid('col'),
      boardId,
      title: String(body.title || 'Coluna'),
      position: (state.columns[boardId] || []).length,
      createdAt: now,
      updatedAt: now,
    };
    state.columns[boardId] = [...(state.columns[boardId] || []), column];
    save(state);
    return ok(column);
  }

  const colItem = path.match(/^\/boards\/([^/]+)\/columns\/([^/]+)$/);
  if (colItem && method === 'PATCH') {
    const column = (state.columns[colItem[1]] || []).find((c) => c.id === colItem[2]);
    if (!column) fail('Coluna não encontrada', 404);
    Object.assign(column, body, { updatedAt: now });
    save(state);
    return ok(column);
  }
  if (colItem && method === 'DELETE') {
    state.columns[colItem[1]] = (state.columns[colItem[1]] || []).filter((c) => c.id !== colItem[2]);
    save(state);
    return ok({ ok: true });
  }

  const labels = path.match(/^\/boards\/([^/]+)\/labels$/);
  if (labels && method === 'GET') return ok(state.labels[labels[1]] || []);
  if (labels && method === 'POST') {
    const label: Label = {
      id: uid('lb'),
      boardId: labels[1],
      name: String(body.name || 'tag'),
      color: String(body.color || '#8b5cf6'),
    };
    state.labels[labels[1]] = [...(state.labels[labels[1]] || []), label];
    save(state);
    return ok(label);
  }
  const labelDel = path.match(/^\/boards\/([^/]+)\/labels\/([^/]+)$/);
  if (labelDel && method === 'DELETE') {
    state.labels[labelDel[1]] = (state.labels[labelDel[1]] || []).filter((l) => l.id !== labelDel[2]);
    save(state);
    return ok({ ok: true });
  }

  const sprints = path.match(/^\/boards\/([^/]+)\/sprints$/);
  if (sprints && method === 'GET') return ok(state.sprints[sprints[1]] || []);
  if (sprints && method === 'POST') {
    const sprint: Sprint = {
      id: uid('sp'),
      boardId: sprints[1],
      name: String(body.name || 'Sprint'),
      status: (body.status as Sprint['status']) || SprintStatus.PLANNED,
      startDate: body.startDate ? String(body.startDate) : null,
      endDate: body.endDate ? String(body.endDate) : null,
      createdAt: now,
      updatedAt: now,
    };
    state.sprints[sprints[1]] = [sprint, ...(state.sprints[sprints[1]] || [])];
    save(state);
    return ok(sprint);
  }

  const activities = path.match(/^\/boards\/([^/]+)\/activities$/);
  if (activities && method === 'GET') {
    const items = state.activities[activities[1]] || [];
    return ok({ items, total: items.length, page: 1, limit: 30 });
  }

  const timelogs = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)\/timelogs$/);
  if (timelogs && method === 'GET') return ok(state.timelogs[timelogs[2]] || []);

  const startLog = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)\/timelogs\/start$/);
  if (startLog && method === 'POST') {
    const log: TimeLog = {
      id: uid('tl'),
      cardId: startLog[2],
      userId: state.user.id,
      startTime: now,
      durationSeconds: 0,
      createdAt: now,
      user: { id: state.user.id, name: state.user.name, email: state.user.email },
    };
    state.timelogs[startLog[2]] = [...(state.timelogs[startLog[2]] || []), log];
    const card = (state.cards[startLog[1]] || []).find((c) => c.id === startLog[2]);
    if (card) card.activeTimer = { id: log.id, userId: state.user.id, startTime: now };
    save(state);
    return ok(log);
  }

  const stopLog = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)\/timelogs\/([^/]+)\/stop$/);
  if (stopLog && method === 'POST') {
    const log = (state.timelogs[stopLog[2]] || []).find((t) => t.id === stopLog[3]);
    if (!log) fail('Apontamento não encontrado', 404);
    log.endTime = now;
    log.durationSeconds = Math.max(60, Math.round((Date.now() - new Date(log.startTime).getTime()) / 1000));
    const card = (state.cards[stopLog[1]] || []).find((c) => c.id === stopLog[2]);
    if (card) {
      card.activeTimer = null;
      card.executedHours = (card.executedHours || 0) + log.durationSeconds / 3600;
    }
    save(state);
    return ok(log);
  }

  const manualLog = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)\/timelogs\/manual$/);
  if (manualLog && method === 'POST') {
    const hours = Number(body.hours || 1);
    const log: TimeLog = {
      id: uid('tl'),
      cardId: manualLog[2],
      userId: state.user.id,
      description: body.description ? String(body.description) : 'Lançamento manual',
      startTime: now,
      endTime: now,
      durationSeconds: Math.round(hours * 3600),
      createdAt: now,
      user: { id: state.user.id, name: state.user.name, email: state.user.email },
    };
    state.timelogs[manualLog[2]] = [...(state.timelogs[manualLog[2]] || []), log];
    const card = (state.cards[manualLog[1]] || []).find((c) => c.id === manualLog[2]);
    if (card) card.executedHours = (card.executedHours || 0) + hours;
    save(state);
    return ok(log);
  }

  const delLog = path.match(/^\/boards\/([^/]+)\/cards\/([^/]+)\/timelogs\/([^/]+)$/);
  if (delLog && method === 'DELETE') {
    state.timelogs[delLog[2]] = (state.timelogs[delLog[2]] || []).filter((t) => t.id !== delLog[3]);
    save(state);
    return ok({ ok: true });
  }

  return ok({ ok: true });
}

export const demoAdapter: AxiosAdapter = async (config) => {
  try {
    const data = handle(config);
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400;
    const message = err instanceof Error ? err.message : 'Erro na demo';
    const error = new Error(message) as Error & {
      response: { data: { message: string }; status: number };
      config: InternalAxiosRequestConfig;
      isAxiosError: boolean;
    };
    error.response = { data: { message }, status };
    error.config = config;
    error.isAxiosError = true;
    return Promise.reject(error);
  }
};
