import { Inject, Injectable } from '@nestjs/common';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface DeleteBoardInput {
  boardId: string;
  userId: string;
}

@Injectable()
export class DeleteBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(input: DeleteBoardInput): Promise<void> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenError('Only OWNER or ADMIN can delete a board');
    }

    const board = await this.boardRepo.findById(input.boardId);
    if (!board) {
      throw new NotFoundError('Board');
    }

    await this.boardRepo.delete(input.boardId);
  }
}
