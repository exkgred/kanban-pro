import { Inject, Injectable } from '@nestjs/common';
import { TimeLogEntity } from '../../../domain/entities/timelog.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  TIMELOG_REPOSITORY,
  type TimeLogRepository,
} from '../../../domain/repositories/timelog.repository';

@Injectable()
export class ListTimeLogsUseCase {
  constructor(
    @Inject(TIMELOG_REPOSITORY)
    private readonly timeLogRepo: TimeLogRepository,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
  ) {}

  async execute(
    boardId: string,
    cardId: string,
    userId: string,
  ): Promise<TimeLogEntity[]> {
    const membership = await this.boardRepo.getMembership(boardId, userId);
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    return this.timeLogRepo.findByCardId(cardId);
  }
}
