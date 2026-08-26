import { Inject, Injectable } from '@nestjs/common';
import type { ActivityWithActor } from '../../../domain/entities/activity.entity';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRepository,
} from '../../../domain/repositories/activity.repository';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface ListActivitiesInput {
  boardId: string;
  userId: string;
  page?: number;
  perPage?: number;
}

export interface ListActivitiesOutput {
  items: ActivityWithActor[];
  total: number;
  page: number;
  perPage: number;
}

@Injectable()
export class ListActivitiesUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
  ) {}

  async execute(input: ListActivitiesInput): Promise<ListActivitiesOutput> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const perPage = input.perPage && input.perPage > 0 ? input.perPage : 20;

    const result = await this.activityRepo.listByBoard(
      input.boardId,
      page,
      perPage,
    );

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
    };
  }
}
