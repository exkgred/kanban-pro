import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { Column } from '../../../domain/entities/board.entity';
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

export interface UpdateColumnInput {
  boardId: string;
  columnId: string;
  userId: string;
  title?: string;
  position?: number;
}

@Injectable()
export class UpdateColumnUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: UpdateColumnInput): Promise<Column> {
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

    const column = await this.boardRepo.updateColumn(input.columnId, {
      title: input.title,
      position: input.position,
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      actorId: input.userId,
      type: 'COLUMN_UPDATED',
      payload: {
        columnId: column.id,
        title: column.title,
        position: column.position,
      },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'column:updated',
      payload: column,
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });

    return column;
  }
}
