import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { Column } from '../../../domain/entities/board.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRepository,
} from '../../../domain/repositories/activity.repository';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface ReorderColumnsInput {
  boardId: string;
  userId: string;
  items: Array<{ id: string; position: number }>;
}

@Injectable()
export class ReorderColumnsUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: ReorderColumnsInput): Promise<Column[]> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const columns = await this.boardRepo.reorderColumns(
      input.boardId,
      input.items,
    );

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      actorId: input.userId,
      type: 'COLUMN_UPDATED',
      payload: { reorder: input.items },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'column:updated',
      payload: columns,
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });

    return columns;
  }
}
