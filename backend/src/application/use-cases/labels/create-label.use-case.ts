import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { Label } from '../../../domain/entities/board.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRepository,
} from '../../../domain/repositories/activity.repository';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface CreateLabelInput {
  boardId: string;
  userId: string;
  name: string;
  color: string;
}

@Injectable()
export class CreateLabelUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: CreateLabelInput): Promise<Label> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const label = await this.boardRepo.createLabel({
      boardId: input.boardId,
      name: input.name,
      color: input.color,
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      actorId: input.userId,
      type: 'LABEL_CREATED',
      payload: { labelId: label.id, name: label.name, color: label.color },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'board:updated',
      payload: { label },
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });

    return label;
  }
}
