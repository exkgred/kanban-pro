import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import type { BoardMember } from '../../../domain/entities/board.entity';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRepository,
} from '../../../domain/repositories/activity.repository';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/repositories/user.repository';
import type { BoardRole } from '../../../domain/value-objects/board-visibility';

export interface AddBoardMemberInput {
  boardId: string;
  userId: string;
  email: string;
  role?: BoardRole;
}

@Injectable()
export class AddBoardMemberUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: ActivityRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: AddBoardMemberInput): Promise<BoardMember> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      throw new ForbiddenError('Only OWNER or ADMIN can add members');
    }

    const invitee = await this.userRepo.findByEmail(input.email);
    if (!invitee) {
      throw new NotFoundError('User', 'User with this email not found');
    }

    const existing = await this.boardRepo.getMembership(
      input.boardId,
      invitee.id,
    );
    if (existing) {
      throw new ConflictError('User is already a board member');
    }

    const member = await this.boardRepo.addMember({
      boardId: input.boardId,
      userId: invitee.id,
      role: input.role ?? 'MEMBER',
    });

    const activity = await this.activityRepo.create({
      boardId: input.boardId,
      actorId: input.userId,
      type: 'MEMBER_ADDED',
      payload: {
        userId: invitee.id,
        email: invitee.email,
        role: member.role,
      },
    });

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'board:updated',
      payload: { member },
    });
    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'activity:created',
      payload: activity,
    });

    return member;
  }
}
