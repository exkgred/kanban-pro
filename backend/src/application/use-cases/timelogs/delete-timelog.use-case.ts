import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  CARD_REPOSITORY,
  type CardRepository,
} from '../../../domain/repositories/card.repository';
import {
  TIMELOG_REPOSITORY,
  type TimeLogRepository,
} from '../../../domain/repositories/timelog.repository';

export interface DeleteTimeLogCommand {
  boardId: string;
  cardId: string;
  timeLogId: string;
  userId: string;
}

export interface DeleteTimeLogResult {
  executedHours: number;
}

@Injectable()
export class DeleteTimeLogUseCase {
  constructor(
    @Inject(TIMELOG_REPOSITORY)
    private readonly timeLogRepo: TimeLogRepository,
    @Inject(CARD_REPOSITORY)
    private readonly cardRepo: CardRepository,
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(cmd: DeleteTimeLogCommand): Promise<DeleteTimeLogResult> {
    const membership = await this.boardRepo.getMembership(
      cmd.boardId,
      cmd.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const timeLog = await this.timeLogRepo.findById(cmd.timeLogId);
    if (!timeLog || timeLog.cardId !== cmd.cardId) {
      throw new NotFoundError('TimeLog');
    }

    await this.timeLogRepo.delete(cmd.timeLogId);

    const executedHours = await this.timeLogRepo.getTotalExecutedHoursByCard(
      cmd.cardId,
    );
    const card = await this.cardRepo.update(cmd.cardId, { executedHours });

    this.realtimePublisher?.publish({
      boardId: cmd.boardId,
      event: 'card:updated',
      payload: card,
    });

    return { executedHours };
  }
}
