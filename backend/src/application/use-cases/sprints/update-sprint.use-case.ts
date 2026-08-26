import { Inject, Injectable } from '@nestjs/common';
import { SprintEntity } from '../../../domain/entities/sprint.entity';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  SPRINT_REPOSITORY,
  type SprintRepository,
  type UpdateSprintInput,
} from '../../../domain/repositories/sprint.repository';

export interface UpdateSprintCommand {
  boardId: string;
  sprintId: string;
  userId: string;
  data: UpdateSprintInput;
}

@Injectable()
export class UpdateSprintUseCase {
  constructor(
    @Inject(SPRINT_REPOSITORY)
    private readonly sprintRepo: SprintRepository,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(cmd: UpdateSprintCommand): Promise<SprintEntity> {
    const membership = await this.boardRepo.getMembership(
      cmd.boardId,
      cmd.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const sprint = await this.sprintRepo.findById(cmd.sprintId);
    if (!sprint || sprint.boardId !== cmd.boardId) {
      throw new NotFoundError('Sprint');
    }

    return this.sprintRepo.update(cmd.sprintId, cmd.data);
  }
}
