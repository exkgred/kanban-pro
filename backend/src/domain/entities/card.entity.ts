import type { CardPriority } from '../value-objects/card-priority';

export interface Card {
  id: string;
  boardId: string;
  columnId: string;
  sprintId?: string | null;
  title: string;
  description: string | null;
  priority: CardPriority;
  dueDate: Date | null;
  assigneeId: string | null;
  position: number;
  estimatedHours: number;
  executedHours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardWithLabels extends Card {
  labels: Array<{ id: string; name: string; color: string }>;
  assignee?: { id: string; name: string; email: string } | null;
  sprint?: { id: string; name: string; status: string } | null;
  activeTimer?: {
    id: string;
    userId: string;
    startTime: Date;
    description?: string | null;
  } | null;
}
