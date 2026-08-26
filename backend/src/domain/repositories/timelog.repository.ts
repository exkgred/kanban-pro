import { TimeLogEntity } from '../entities/timelog.entity';

export const TIMELOG_REPOSITORY = Symbol('TIMELOG_REPOSITORY');

export interface CreateTimeLogInput {
  cardId: string;
  userId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
}

export interface TimeLogRepository {
  findById(id: string): Promise<TimeLogEntity | null>;
  findByCardId(cardId: string): Promise<TimeLogEntity[]>;
  findActiveByCardAndUser(
    cardId: string,
    userId: string,
  ): Promise<TimeLogEntity | null>;
  create(input: CreateTimeLogInput): Promise<TimeLogEntity>;
  stop(
    id: string,
    endTime: Date,
    durationSeconds: number,
  ): Promise<TimeLogEntity>;
  delete(id: string): Promise<void>;
  getTotalExecutedHoursByCard(cardId: string): Promise<number>;
}
