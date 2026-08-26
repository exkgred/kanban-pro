import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { CardWithLabels } from '../../../domain/entities/card.entity';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRepository,
} from '../../../domain/repositories/activity.repository';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  CARD_REPOSITORY,
  type CardRepository,
} from '../../../domain/repositories/card.repository';
import type { CardPriority } from '../../../domain/value-objects/card-priority';

export interface CreateCardInput {
  boardId: string;
  userId: string;
  columnId: string;
  sprintId?: string | null;
  title: string;
  description?: string | null;
  priority?: CardPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  estimatedHours?: number;
  labelIds?: string[];
}

@Injectable()
export class CreateCardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cardRepo: CardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: CreateCardInput): Promise<CardWithLabels> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const column = await this.boardRepo.findColumn(
      input.boardId,
      input.columnId,
    );
    if (!column) {
      throw new NotFoundError('Column');
    }

    const position = await this.cardRepo.nextPosition(input.columnId);
    const card = await this.cardRepo.create({
      boardId: input.boardId,
      columnId: input.columnId,
      sprintId: input.sprintId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 'MEDIUM',
      dueDate: input.dueDate ?? null,
      assigneeId: input.assigneeId ?? null,
      position,
      estimatedHours: input.estimatedHours ?? 0,
      labelIds: input.labelIds,
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      cardId: card.id,
      actorId: input.userId,
      type: 'CARD_CREATED',
      payload: { cardId: card.id, title: card.title, columnId: card.columnId },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'card:created',
      payload: card,
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });

    return card;
  }
}
