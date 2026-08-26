import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { CardWithLabels } from '../../domain/entities/card.entity';
import type {
  CardFilters,
  CardRepository,
} from '../../domain/repositories/card.repository';
import type { CardPriority } from '../../domain/value-objects/card-priority';
import { PrismaService } from '../database/prisma.service';

const cardInclude = {
  labels: {
    include: {
      label: { select: { id: true, name: true, color: true } },
    },
  },
  assignee: { select: { id: true, name: true, email: true } },
  sprint: { select: { id: true, name: true, status: true } },
  timeLogs: {
    where: { endTime: null },
    take: 1,
    select: { id: true, userId: true, startTime: true, description: true },
  },
} satisfies Prisma.CardInclude;

type CardRow = Prisma.CardGetPayload<{ include: typeof cardInclude }>;

@Injectable()
export class PrismaCardRepository implements CardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    boardId: string;
    columnId: string;
    sprintId?: string | null;
    title: string;
    description?: string | null;
    priority: CardPriority;
    dueDate?: Date | null;
    assigneeId?: string | null;
    position: number;
    estimatedHours?: number;
    labelIds?: string[];
  }): Promise<CardWithLabels> {
    const row = await this.prisma.card.create({
      data: {
        boardId: data.boardId,
        columnId: data.columnId,
        sprintId: data.sprintId ?? null,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
        assigneeId: data.assigneeId ?? null,
        position: data.position,
        estimatedHours: data.estimatedHours ?? 0,
        labels:
          data.labelIds && data.labelIds.length > 0
            ? {
                create: data.labelIds.map((labelId) => ({ labelId })),
              }
            : undefined,
      },
      include: cardInclude,
    });
    return this.toCardWithLabels(row);
  }

  async findById(
    boardId: string,
    cardId: string,
  ): Promise<CardWithLabels | null> {
    const row = await this.prisma.card.findFirst({
      where: { id: cardId, boardId },
      include: cardInclude,
    });
    return row ? this.toCardWithLabels(row) : null;
  }

  async listByBoard(
    boardId: string,
    filters?: CardFilters,
  ): Promise<CardWithLabels[]> {
    const where: Prisma.CardWhereInput = { boardId };

    if (filters?.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters?.sprintId) {
      where.sprintId = filters.sprintId;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.labelId) {
      where.labels = { some: { labelId: filters.labelId } };
    }
    if (filters?.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.card.findMany({
      where,
      include: cardInclude,
      orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
    });
    return rows.map((row) => this.toCardWithLabels(row));
  }

  async update(
    cardId: string,
    data: Partial<{
      title: string;
      description: string | null;
      priority: CardPriority;
      dueDate: Date | null;
      assigneeId: string | null;
      sprintId: string | null;
      estimatedHours: number;
      executedHours: number;
      labelIds: string[];
    }>,
  ): Promise<CardWithLabels> {
    const { labelIds, ...fields } = data;

    const row = await this.prisma.$transaction(async (tx) => {
      if (labelIds !== undefined) {
        await tx.cardLabel.deleteMany({ where: { cardId } });
        if (labelIds.length > 0) {
          await tx.cardLabel.createMany({
            data: labelIds.map((labelId) => ({ cardId, labelId })),
          });
        }
      }

      return tx.card.update({
        where: { id: cardId },
        data: fields,
        include: cardInclude,
      });
    });

    return this.toCardWithLabels(row);
  }

  async delete(cardId: string): Promise<void> {
    await this.prisma.card.delete({ where: { id: cardId } });
  }

  async move(data: {
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    toPosition: number;
  }): Promise<CardWithLabels> {
    const row = await this.prisma.$transaction(async (tx) => {
      const card = await tx.card.findUniqueOrThrow({
        where: { id: data.cardId },
      });

      const fromPos = card.position;
      const { fromColumnId, toColumnId, toPosition } = data;

      if (fromColumnId === toColumnId) {
        if (fromPos !== toPosition) {
          if (fromPos < toPosition) {
            await tx.card.updateMany({
              where: {
                columnId: fromColumnId,
                position: { gt: fromPos, lte: toPosition },
              },
              data: { position: { decrement: 1 } },
            });
          } else {
            await tx.card.updateMany({
              where: {
                columnId: fromColumnId,
                position: { gte: toPosition, lt: fromPos },
              },
              data: { position: { increment: 1 } },
            });
          }
          await tx.card.update({
            where: { id: data.cardId },
            data: { position: toPosition },
          });
        }
      } else {
        await tx.card.updateMany({
          where: {
            columnId: fromColumnId,
            position: { gt: fromPos },
          },
          data: { position: { decrement: 1 } },
        });
        await tx.card.updateMany({
          where: {
            columnId: toColumnId,
            position: { gte: toPosition },
          },
          data: { position: { increment: 1 } },
        });
        await tx.card.update({
          where: { id: data.cardId },
          data: { columnId: toColumnId, position: toPosition },
        });
      }

      return tx.card.findUniqueOrThrow({
        where: { id: data.cardId },
        include: cardInclude,
      });
    });

    return this.toCardWithLabels(row);
  }

  async nextPosition(columnId: string): Promise<number> {
    const agg = await this.prisma.card.aggregate({
      where: { columnId },
      _max: { position: true },
    });
    return (agg._max.position ?? -1) + 1;
  }

  private toCardWithLabels(row: CardRow): CardWithLabels {
    const activeTimer =
      row.timeLogs && row.timeLogs.length > 0 ? row.timeLogs[0] : null;
    return {
      id: row.id,
      boardId: row.boardId,
      columnId: row.columnId,
      sprintId: row.sprintId,
      title: row.title,
      description: row.description,
      priority: row.priority,
      dueDate: row.dueDate,
      assigneeId: row.assigneeId,
      position: row.position,
      estimatedHours: row.estimatedHours,
      executedHours: row.executedHours,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      labels: row.labels.map((cl) => cl.label),
      assignee: row.assignee,
      sprint: row.sprint,
      activeTimer: activeTimer
        ? {
            id: activeTimer.id,
            userId: activeTimer.userId,
            startTime: activeTimer.startTime,
            description: activeTimer.description,
          }
        : null,
    };
  }
}
