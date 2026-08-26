export enum CardPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum BoardVisibility {
  PRIVATE = 'PRIVATE',
  WORKSPACE = 'WORKSPACE',
}

export enum BoardRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  visibility: BoardVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  boardId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimer {
  id: string;
  userId: string;
  startTime: string;
  description?: string | null;
}

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  sprintId?: string | null;
  title: string;
  description?: string;
  priority: CardPriority;
  position: number;
  dueDate?: string;
  assigneeId?: string;
  estimatedHours?: number;
  executedHours?: number;
  createdAt: string;
  updatedAt: string;
  labels?: Label[];
  sprint?: { id: string; name: string; status: string } | null;
  activeTimer?: ActiveTimer | null;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface TimeLog {
  id: string;
  cardId: string;
  userId: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  durationSeconds: number;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Activity {
  id: string;
  boardId: string;
  type: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
