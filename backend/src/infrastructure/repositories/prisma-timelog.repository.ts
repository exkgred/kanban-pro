import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  TimeLogRepository,
  CreateTimeLogInput,
} from '../../domain/repositories/timelog.repository';
import { TimeLogEntity } from '../../domain/entities/timelog.entity';

@Injectable()
export class PrismaTimeLogRepository implements TimeLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TimeLogEntity | null> {
    const timeLog = await this.prisma.timeLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return timeLog;
  }

  async findByCardId(cardId: string): Promise<TimeLogEntity[]> {
    const logs = await this.prisma.timeLog.findMany({
      where: { cardId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    return logs;
  }

  async findActiveByCardAndUser(
    cardId: string,
    userId: string,
  ): Promise<TimeLogEntity | null> {
    const active = await this.prisma.timeLog.findFirst({
      where: {
        cardId,
        userId,
        endTime: null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return active;
  }

  async create(input: CreateTimeLogInput): Promise<TimeLogEntity> {
    const timeLog = await this.prisma.timeLog.create({
      data: {
        cardId: input.cardId,
        userId: input.userId,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        durationSeconds: input.durationSeconds ?? 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return timeLog;
  }

  async stop(
    id: string,
    endTime: Date,
    durationSeconds: number,
  ): Promise<TimeLogEntity> {
    const timeLog = await this.prisma.timeLog.update({
      where: { id },
      data: {
        endTime,
        durationSeconds,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return timeLog;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.timeLog.delete({
      where: { id },
    });
  }

  async getTotalExecutedHoursByCard(cardId: string): Promise<number> {
    const total = await this.prisma.timeLog.aggregate({
      where: { cardId },
      _sum: { durationSeconds: true },
    });
    const totalSeconds = total._sum.durationSeconds ?? 0;
    return Number((totalSeconds / 3600).toFixed(2));
  }
}
