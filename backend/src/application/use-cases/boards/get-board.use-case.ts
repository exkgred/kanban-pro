import { Inject, Injectable } from '@nestjs/common';
import type { BoardWithDetails } from '../../../domain/entities/board.entity';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface GetBoardInput {
  boardId: string;
  userId: string;
}

@Injectable()
export class GetBoardUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(input: GetBoardInput): Promise<BoardWithDetails> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const board = await this.boardRepo.findDetailById(input.boardId);
    if (!board) {
      throw new NotFoundError('Board');
    }
    return board;
  }
}
