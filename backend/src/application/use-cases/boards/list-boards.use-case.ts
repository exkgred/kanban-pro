import { Inject, Injectable } from '@nestjs/common';
import type { Board } from '../../../domain/entities/board.entity';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface ListBoardsInput {
  userId: string;
}

@Injectable()
export class ListBoardsUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(input: ListBoardsInput): Promise<Board[]> {
    return this.boardRepo.listForUser(input.userId);
  }
}
