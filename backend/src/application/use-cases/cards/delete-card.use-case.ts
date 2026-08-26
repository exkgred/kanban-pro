import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
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

export interface DeleteCardInput {
  boardId: string;
  cardId: string;
  userId: string;
}

@Injectable()
export class DeleteCardUseCase {
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

  async execute(input: DeleteCardInput): Promise<void> {
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

    await this.cardRepo.delete(input.cardId);

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      cardId: input.cardId,
      actorId: input.userId,
      type: 'CARD_DELETED',
      payload: {
        cardId: input.cardId,
        title: existing.title,
        columnId: existing.columnId,
      },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'card:deleted',
      payload: { cardId: input.cardId },
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });
  }
}
