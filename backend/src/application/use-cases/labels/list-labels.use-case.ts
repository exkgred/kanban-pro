import { Inject, Injectable } from '@nestjs/common';
import type { Label } from '../../../domain/entities/board.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface ListLabelsInput {
  boardId: string;
  userId: string;
}

@Injectable()
export class ListLabelsUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(input: ListLabelsInput): Promise<Label[]> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    return this.boardRepo.listLabels(input.boardId);
  }
}
