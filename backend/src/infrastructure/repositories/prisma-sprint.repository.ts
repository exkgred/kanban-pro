import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  SprintRepository,
  CreateSprintInput,
  UpdateSprintInput,
} from '../../domain/repositories/sprint.repository';
import {
  SprintEntity,
  SprintStatus,
} from '../../domain/entities/sprint.entity';

@Injectable()
export class PrismaSprintRepository implements SprintRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SprintEntity | null> {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });
    if (!sprint) return null;
    return {
      ...sprint,
      status: sprint.status as SprintStatus,
    };
  }

  async findByBoardId(boardId: string): Promise<SprintEntity[]> {
    const sprints = await this.prisma.sprint.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
    });
    return sprints.map((s) => ({
      ...s,
      status: s.status as SprintStatus,
    }));
  }

  async create(input: CreateSprintInput): Promise<SprintEntity> {
    const sprint = await this.prisma.sprint.create({
      data: {
        boardId: input.boardId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status ?? SprintStatus.PLANNED,
      },
    });
    return {
      ...sprint,
      status: sprint.status as SprintStatus,
    };
  }

  async update(id: string, input: UpdateSprintInput): Promise<SprintEntity> {
    const sprint = await this.prisma.sprint.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.startDate !== undefined
          ? { startDate: input.startDate }
          : {}),
        ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
    });
    return {
      ...sprint,
      status: sprint.status as SprintStatus,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.sprint.delete({
      where: { id },
    });
  }
}
