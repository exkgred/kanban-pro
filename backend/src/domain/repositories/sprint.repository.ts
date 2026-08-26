import { SprintEntity, SprintStatus } from '../entities/sprint.entity';

export const SPRINT_REPOSITORY = Symbol('SPRINT_REPOSITORY');

export interface CreateSprintInput {
  boardId: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status?: SprintStatus;
}

export interface UpdateSprintInput {
  name?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: SprintStatus;
}

export interface SprintRepository {
  findById(id: string): Promise<SprintEntity | null>;
  findByBoardId(boardId: string): Promise<SprintEntity[]>;
  create(input: CreateSprintInput): Promise<SprintEntity>;
  update(id: string, input: UpdateSprintInput): Promise<SprintEntity>;
  delete(id: string): Promise<void>;
}
