import { Inject, Injectable } from '@nestjs/common';
import { SprintEntity } from '../../../domain/entities/sprint.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  SPRINT_REPOSITORY,
  type SprintRepository,
} from '../../../domain/repositories/sprint.repository';

@Injectable()
export class ListSprintsUseCase {
  constructor(
    @Inject(SPRINT_REPOSITORY)
    private readonly sprintRepo: SprintRepository,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(boardId: string, userId: string): Promise<SprintEntity[]> {
    const membership = await this.boardRepo.getMembership(boardId, userId);
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    return this.sprintRepo.findByBoardId(boardId);
  }
}
