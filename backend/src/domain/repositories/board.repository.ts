import type {
  Board,
  BoardMember,
  BoardWithDetails,
  Column,
  Label,
} from '../entities/board.entity';
import type {
  BoardRole,
  BoardVisibility,
} from '../value-objects/board-visibility';

export const BOARD_REPOSITORY = Symbol('BOARD_REPOSITORY');

export interface BoardRepository {
  create(data: {
    title: string;
    description?: string | null;
    visibility: BoardVisibility;
    ownerId: string;
  }): Promise<Board>;

  findById(id: string): Promise<Board | null>;
  findDetailById(id: string): Promise<BoardWithDetails | null>;
  listForUser(userId: string): Promise<Board[]>;
  update(
    id: string,
    data: Partial<{
      title: string;
      description: string | null;
      visibility: BoardVisibility;
    }>,
  ): Promise<Board>;
  delete(id: string): Promise<void>;

  getMembership(boardId: string, userId: string): Promise<BoardMember | null>;
  addMember(data: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }): Promise<BoardMember>;

  createColumn(data: {
    boardId: string;
    title: string;
    position: number;
  }): Promise<Column>;
  findColumn(boardId: string, columnId: string): Promise<Column | null>;
  updateColumn(
    columnId: string,
    data: Partial<{ title: string; position: number }>,
  ): Promise<Column>;
  deleteColumn(columnId: string): Promise<void>;
  reorderColumns(
    boardId: string,
    items: Array<{ id: string; position: number }>,
  ): Promise<Column[]>;
  nextColumnPosition(boardId: string): Promise<number>;

  createLabel(data: {
    boardId: string;
    name: string;
    color: string;
  }): Promise<Label>;
  listLabels(boardId: string): Promise<Label[]>;
  deleteLabel(labelId: string): Promise<void>;
}
