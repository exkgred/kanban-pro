import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  Activity,
  ActivityType,
  ActivityWithActor,
} from '../../domain/entities/activity.entity';
import type { ActivityRepository } from '../../domain/repositories/activity.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    boardId: string;
    cardId?: string | null;
    actorId: string;
    type: ActivityType;
    payload: Record<string, unknown>;
  }): Promise<Activity> {
    const row = await this.prisma.activity.create({
      data: {
        boardId: data.boardId,
        cardId: data.cardId ?? null,
        actorId: data.actorId,
        type: data.type,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
    return this.toDomain(row);
  }

  async listByBoard(
    boardId: string,
    page: number,
    perPage: number,
  ): Promise<{ items: ActivityWithActor[]; total: number }> {
    const skip = (page - 1) * perPage;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where: { boardId },
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.activity.count({ where: { boardId } }),
    ]);

    return {
      items: rows.map((row) => ({
        ...this.toDomain(row),
        actor: row.actor,
      })),
      total,
    };
  }

  private toDomain(row: {
    id: string;
    boardId: string;
    cardId: string | null;
    actorId: string;
    type: string;
    payload: Prisma.JsonValue;
    createdAt: Date;
  }): Activity {
    return {
      id: row.id,
      boardId: row.boardId,
      cardId: row.cardId,
      actorId: row.actorId,
      type: row.type as ActivityType,
      payload: this.toPayload(row.payload),
      createdAt: row.createdAt,
    };
  }

  private toPayload(value: Prisma.JsonValue): Record<string, unknown> {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }
}
