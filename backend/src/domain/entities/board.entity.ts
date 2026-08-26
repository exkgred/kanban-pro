import type {
  BoardRole,
  BoardVisibility,
} from '../value-objects/board-visibility';

export interface Board {
  id: string;
  title: string;
  description: string | null;
  visibility: BoardVisibility;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardMember {
  boardId: string;
  userId: string;
  role: BoardRole;
  createdAt: Date;
}

export interface BoardWithDetails extends Board {
  columns: Column[];
  members: Array<
    BoardMember & { user: { id: string; name: string; email: string } }
  >;
  labels: Label[];
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: Date;
}
