import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import { TimeLogEntity } from '../../../domain/entities/timelog.entity';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
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

export interface StartTimeLogCommand {
  boardId: string;
  cardId: string;
  userId: string;
  description?: string;
}

@Injectable()
export class StartTimeLogUseCase {
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

  async execute(cmd: StartTimeLogCommand): Promise<TimeLogEntity> {
    const membership = await this.boardRepo.getMembership(
      cmd.boardId,
      cmd.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const card = await this.cardRepo.findById(cmd.boardId, cmd.cardId);
    if (!card) {
      throw new NotFoundError('Card');
    }

    const existing = await this.timeLogRepo.findActiveByCardAndUser(
      cmd.cardId,
      cmd.userId,
    );
    if (existing) {
      throw new ValidationError('Já existe um cronômetro ativo para este card');
    }

    const timeLog = await this.timeLogRepo.create({
      cardId: cmd.cardId,
      userId: cmd.userId,
      description: cmd.description,
      startTime: new Date(),
    });

    const updatedCard = await this.cardRepo.findById(cmd.boardId, cmd.cardId);
    if (updatedCard) {
      this.realtimePublisher?.publish({
        boardId: cmd.boardId,
        event: 'card:updated',
        payload: updatedCard,
      });
    }

    return timeLog;
  }
}
