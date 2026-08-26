import { Inject, Injectable } from '@nestjs/common';
import {
  SprintEntity,
  SprintStatus,
} from '../../../domain/entities/sprint.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  SPRINT_REPOSITORY,
  type SprintRepository,
} from '../../../domain/repositories/sprint.repository';

export interface CreateSprintCommand {
  boardId: string;
  userId: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status?: SprintStatus;
}

@Injectable()
export class CreateSprintUseCase {
  constructor(
    @Inject(SPRINT_REPOSITORY)
    private readonly sprintRepo: SprintRepository,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(cmd: CreateSprintCommand): Promise<SprintEntity> {
    const membership = await this.boardRepo.getMembership(
      cmd.boardId,
      cmd.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    return this.sprintRepo.create({
      boardId: cmd.boardId,
      name: cmd.name,
      startDate: cmd.startDate,
      endDate: cmd.endDate,
      status: cmd.status,
    });
  }
}
