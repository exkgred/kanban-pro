import { Inject, Injectable } from '@nestjs/common';
import type { CardWithLabels } from '../../../domain/entities/card.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  CARD_REPOSITORY,
  type CardFilters,
  type CardRepository,
} from '../../../domain/repositories/card.repository';

export interface ListCardsInput {
  boardId: string;
  userId: string;
  filters?: CardFilters;
}

@Injectable()
export class ListCardsUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cardRepo: CardRepository,
  ) {}

  async execute(input: ListCardsInput): Promise<CardWithLabels[]> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    return this.cardRepo.listByBoard(input.boardId, input.filters);
  }
}
