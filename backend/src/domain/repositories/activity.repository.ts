import type {
  Activity,
  ActivityType,
  ActivityWithActor,
} from '../entities/activity.entity';

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

export interface ActivityRepository {
  create(data: {
    boardId: string;
    cardId?: string | null;
    actorId: string;
    type: ActivityType;
    payload: Record<string, unknown>;
  }): Promise<Activity>;

  listByBoard(
    boardId: string,
    page: number,
    perPage: number,
  ): Promise<{ items: ActivityWithActor[]; total: number }>;
}
