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

export interface AddManualTimeLogCommand {
  boardId: string;
  cardId: string;
  userId: string;
  description?: string;
  hours: number;
  date?: Date;
}

export interface ManualTimeLogResult {
  timeLog: TimeLogEntity;
  executedHours: number;
}

@Injectable()
export class AddManualTimeLogUseCase {
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

  async execute(cmd: AddManualTimeLogCommand): Promise<ManualTimeLogResult> {
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

    if (cmd.hours <= 0) {
      throw new ValidationError('Informe uma duração maior que zero');
    }

    const startTime = cmd.date ? new Date(cmd.date) : new Date();
    const durationSeconds = Math.round(cmd.hours * 3600);
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

    const timeLog = await this.timeLogRepo.create({
      cardId: cmd.cardId,
      userId: cmd.userId,
      description: cmd.description,
      startTime,
      endTime,
      durationSeconds,
    });

    const executedHours = await this.timeLogRepo.getTotalExecutedHoursByCard(
      cmd.cardId,
    );
    const updatedCard = await this.cardRepo.update(cmd.cardId, {
      executedHours,
    });

    this.realtimePublisher?.publish({
      boardId: cmd.boardId,
      event: 'card:updated',
      payload: updatedCard,
    });

    return { timeLog, executedHours };
  }
}
