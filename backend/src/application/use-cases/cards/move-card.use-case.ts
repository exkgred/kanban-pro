import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { CardWithLabels } from '../../../domain/entities/card.entity';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
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

export interface MoveCardInput {
  boardId: string;
  cardId: string;
  userId: string;
  columnId: string;
  position: number;
}

@Injectable()
export class MoveCardUseCase {
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

  async execute(input: MoveCardInput): Promise<CardWithLabels> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    if (input.position < 0) {
      throw new ValidationError('Position must be >= 0');
    }

    const existing = await this.cardRepo.findById(input.boardId, input.cardId);
    if (!existing) {
      throw new NotFoundError('Card');
    }

    const targetColumn = await this.boardRepo.findColumn(
      input.boardId,
      input.columnId,
    );
    if (!targetColumn) {
      throw new NotFoundError('Column');
    }

    const card = await this.cardRepo.move({
      cardId: input.cardId,
      fromColumnId: existing.columnId,
      toColumnId: input.columnId,
      toPosition: input.position,
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      cardId: card.id,
      actorId: input.userId,
      type: 'CARD_MOVED',
      payload: {
        cardId: card.id,
        fromColumnId: existing.columnId,
        toColumnId: card.columnId,
        position: card.position,
      },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'card:moved',
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
