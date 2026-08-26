import { Inject, Injectable } from '@nestjs/common';
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
} from '../../../domain/repositories/sprint.repository';

export interface DeleteSprintCommand {
  boardId: string;
  sprintId: string;
  userId: string;
}

@Injectable()
export class DeleteSprintUseCase {
  constructor(
    @Inject(SPRINT_REPOSITORY)
    private readonly sprintRepo: SprintRepository,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(cmd: DeleteSprintCommand): Promise<void> {
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

    await this.sprintRepo.delete(cmd.sprintId);
  }
}
