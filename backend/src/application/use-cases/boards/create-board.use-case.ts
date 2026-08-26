import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { Board } from '../../../domain/entities/board.entity';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRepository,
} from '../../../domain/repositories/activity.repository';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import type { BoardVisibility } from '../../../domain/value-objects/board-visibility';

export interface CreateBoardInput {
  userId: string;
  title: string;
  description?: string | null;
  visibility?: BoardVisibility;
}

const DEFAULT_COLUMNS = ['To Do', 'Doing', 'Done'] as const;

@Injectable()
export class CreateBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: CreateBoardInput): Promise<Board> {
    const board = await this.boardRepo.create({
      title: input.title,
      description: input.description ?? null,
      visibility: input.visibility ?? 'PRIVATE',
      ownerId: input.userId,
    });

    await this.boardRepo.addMember({
      boardId: board.id,
      userId: input.userId,
      role: 'OWNER',
    });

    for (let i = 0; i < DEFAULT_COLUMNS.length; i += 1) {
      await this.boardRepo.createColumn({
        boardId: board.id,
        title: DEFAULT_COLUMNS[i],
        position: i,
      });
    }

    const activity = await this.activityRepo.create({
      boardId: board.id,
      actorId: input.userId,
      type: 'BOARD_CREATED',
      payload: { title: board.title },
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
