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

export interface UpdateCardInput {
  boardId: string;
  cardId: string;
  userId: string;
  title?: string;
  description?: string | null;
  priority?: CardPriority;
  dueDate?: Date | null;
  assigneeId?: string | null;
  sprintId?: string | null;
  estimatedHours?: number;
  labelIds?: string[];
}

@Injectable()
export class UpdateCardUseCase {
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

  async execute(input: UpdateCardInput): Promise<CardWithLabels> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const existing = await this.cardRepo.findById(input.boardId, input.cardId);
    if (!existing) {
      throw new NotFoundError('Card');
    }

    const card = await this.cardRepo.update(input.cardId, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      sprintId: input.sprintId,
      estimatedHours: input.estimatedHours,
      labelIds: input.labelIds,
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      cardId: card.id,
      actorId: input.userId,
      type: 'CARD_UPDATED',
      payload: {
        cardId: card.id,
        title: card.title,
        priority: card.priority,
      },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'card:updated',
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
