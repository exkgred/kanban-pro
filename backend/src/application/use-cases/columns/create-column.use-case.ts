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

export interface CreateColumnInput {
  boardId: string;
  userId: string;
  title: string;
  position?: number;
}

@Injectable()
export class CreateColumnUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: CreateColumnInput): Promise<Column> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const position =
      input.position ??
      (await this.boardRepo.nextColumnPosition(input.boardId));

    const column = await this.boardRepo.createColumn({
      boardId: input.boardId,
      title: input.title,
      position,
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      actorId: input.userId,
      type: 'COLUMN_CREATED',
      payload: { columnId: column.id, title: column.title },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'column:created',
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
