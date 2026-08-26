import { Injectable } from '@nestjs/common';
import type {
  Board,
  BoardMember,
  BoardWithDetails,
  Column,
  Label,
} from '../../domain/entities/board.entity';
import type { BoardRepository } from '../../domain/repositories/board.repository';
import type {
  BoardRole,
  BoardVisibility,
} from '../../domain/value-objects/board-visibility';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaBoardRepository implements BoardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string | null;
    visibility: BoardVisibility;
    ownerId: string;
  }): Promise<Board> {
    const row = await this.prisma.board.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        visibility: data.visibility,
        ownerId: data.ownerId,
      },
    });
    return this.toBoard(row);
  }

  async findById(id: string): Promise<Board | null> {
    const row = await this.prisma.board.findUnique({ where: { id } });
    return row ? this.toBoard(row) : null;
  }

  async findDetailById(id: string): Promise<BoardWithDetails | null> {
    const row = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: { orderBy: { position: 'asc' } },
        labels: { orderBy: { name: 'asc' } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!row) {
      return null;
    }
    return {
      ...this.toBoard(row),
      columns: row.columns.map((c) => this.toColumn(c)),
      labels: row.labels.map((l) => this.toLabel(l)),
      members: row.members.map((m) => ({
        boardId: m.boardId,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
    };
  }

  async listForUser(userId: string): Promise<Board[]> {
    const rows = await this.prisma.board.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toBoard(row));
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      visibility: BoardVisibility;
    }>,
  ): Promise<Board> {
    const row = await this.prisma.board.update({
      where: { id },
      data,
    });
    return this.toBoard(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.board.delete({ where: { id } });
  }

  async getMembership(
    boardId: string,
    userId: string,
  ): Promise<BoardMember | null> {
    const row = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    return row ? this.toMember(row) : null;
  }

  async addMember(data: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }): Promise<BoardMember> {
    const row = await this.prisma.boardMember.create({ data });
    return this.toMember(row);
  }

  async createColumn(data: {
    boardId: string;
    title: string;
    position: number;
  }): Promise<Column> {
    const row = await this.prisma.column.create({ data });
    return this.toColumn(row);
  }

  async findColumn(boardId: string, columnId: string): Promise<Column | null> {
    const row = await this.prisma.column.findFirst({
      where: { id: columnId, boardId },
    });
    return row ? this.toColumn(row) : null;
  }

  async updateColumn(
    columnId: string,
    data: Partial<{ title: string; position: number }>,
  ): Promise<Column> {
    const row = await this.prisma.column.update({
      where: { id: columnId },
      data,
    });
    return this.toColumn(row);
  }

  async deleteColumn(columnId: string): Promise<void> {
    await this.prisma.column.delete({ where: { id: columnId } });
  }

  async reorderColumns(
    boardId: string,
    items: Array<{ id: string; position: number }>,
  ): Promise<Column[]> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.column.updateMany({
          where: { id: item.id, boardId },
          data: { position: item.position },
        }),
      ),
    );
    const rows = await this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
    return rows.map((row) => this.toColumn(row));
  }

  async nextColumnPosition(boardId: string): Promise<number> {
    const agg = await this.prisma.column.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    return (agg._max.position ?? -1) + 1;
  }

  async createLabel(data: {
    boardId: string;
    name: string;
    color: string;
  }): Promise<Label> {
    const row = await this.prisma.label.create({ data });
    return this.toLabel(row);
  }

  async listLabels(boardId: string): Promise<Label[]> {
    const rows = await this.prisma.label.findMany({
      where: { boardId },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toLabel(row));
  }

  async deleteLabel(labelId: string): Promise<void> {
    await this.prisma.label.delete({ where: { id: labelId } });
  }

  private toBoard(row: {
    id: string;
    title: string;
    description: string | null;
    visibility: BoardVisibility;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Board {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      visibility: row.visibility,
      ownerId: row.ownerId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toMember(row: {
    boardId: string;
    userId: string;
    role: BoardRole;
    createdAt: Date;
  }): BoardMember {
    return {
      boardId: row.boardId,
      userId: row.userId,
      role: row.role,
      createdAt: row.createdAt,
    };
  }

  private toColumn(row: {
    id: string;
    boardId: string;
    title: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Column {
    return {
      id: row.id,
      boardId: row.boardId,
      title: row.title,
      position: row.position,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toLabel(row: {
    id: string;
    boardId: string;
    name: string;
    color: string;
    createdAt: Date;
  }): Label {
    return {
      id: row.id,
      boardId: row.boardId,
      name: row.name,
      color: row.color,
      createdAt: row.createdAt,
    };
  }
}
