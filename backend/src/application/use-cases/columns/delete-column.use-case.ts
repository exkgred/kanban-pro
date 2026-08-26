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

export interface DeleteColumnInput {
  boardId: string;
  columnId: string;
  userId: string;
}

@Injectable()
export class DeleteColumnUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: DeleteColumnInput): Promise<void> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const existing = await this.boardRepo.findColumn(
      input.boardId,
      input.columnId,
    );
    if (!existing) {
      throw new NotFoundError('Column');
    }

    await this.boardRepo.deleteColumn(input.columnId);

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      actorId: input.userId,
      type: 'COLUMN_DELETED',
      payload: { columnId: input.columnId, title: existing.title },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'column:deleted',
      payload: { columnId: input.columnId },
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });
  }
}
