import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { Board } from '../../../domain/entities/board.entity';
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
import type { BoardVisibility } from '../../../domain/value-objects/board-visibility';

export interface UpdateBoardInput {
  boardId: string;
  userId: string;
  title?: string;
  description?: string | null;
  visibility?: BoardVisibility;
}

@Injectable()
export class UpdateBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: UpdateBoardInput): Promise<Board> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const existing = await this.boardRepo.findById(input.boardId);
    if (!existing) {
      throw new NotFoundError('Board');
    }

    const board = await this.boardRepo.update(input.boardId, {
      title: input.title,
      description: input.description,
      visibility: input.visibility,
    });

    const activity = await this.activityRepo.create({
      boardId: board.id,
      actorId: input.userId,
      type: 'BOARD_UPDATED',
      payload: {
        title: board.title,
        description: board.description,
        visibility: board.visibility,
      },
    });

    this.realtimePublisher?.publish({
      boardId: board.id,
      event: 'board:updated',
      payload: board,
    });
    this.realtimePublisher?.publish({
      boardId: board.id,
      event: 'activity:created',
      payload: activity,
    });

    return board;
  }
}
