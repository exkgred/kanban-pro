import type { CardWithLabels } from '../entities/card.entity';
import type { CardPriority } from '../value-objects/card-priority';

export const CARD_REPOSITORY = Symbol('CARD_REPOSITORY');

export interface CardFilters {
  labelId?: string;
  assigneeId?: string;
  sprintId?: string;
  priority?: CardPriority;
  q?: string;
}

export interface CardRepository {
  create(data: {
    boardId: string;
    columnId: string;
    sprintId?: string | null;
    title: string;
    description?: string | null;
    priority: CardPriority;
    dueDate?: Date | null;
    assigneeId?: string | null;
    position: number;
    estimatedHours?: number;
    labelIds?: string[];
  }): Promise<CardWithLabels>;

  findById(boardId: string, cardId: string): Promise<CardWithLabels | null>;
  listByBoard(
    boardId: string,
    filters?: CardFilters,
  ): Promise<CardWithLabels[]>;
  update(
    cardId: string,
    data: Partial<{
      title: string;
      description: string | null;
      priority: CardPriority;
      dueDate: Date | null;
      assigneeId: string | null;
      sprintId: string | null;
      estimatedHours: number;
      executedHours: number;
      labelIds: string[];
    }>,
  ): Promise<CardWithLabels>;
  delete(cardId: string): Promise<void>;
  move(data: {
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    toPosition: number;
  }): Promise<CardWithLabels>;
  nextPosition(columnId: string): Promise<number>;
}
