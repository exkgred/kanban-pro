import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  REALTIME_PUBLISHER,
  type RealtimePublisher,
} from '../../interfaces/realtime-publisher';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../../domain/repositories/board.repository';

export interface DeleteLabelInput {
  boardId: string;
  labelId: string;
  userId: string;
}

@Injectable()
export class DeleteLabelUseCase {
  constructor(
    @Inject(BOARD_REPOSITORY)
    private readonly boardRepo: BoardRepository,
    @Optional()
    @Inject(REALTIME_PUBLISHER)
    private readonly realtimePublisher?: RealtimePublisher,
  ) {}

  async execute(input: DeleteLabelInput): Promise<void> {
    const membership = await this.boardRepo.getMembership(
      input.boardId,
      input.userId,
    );
    if (!membership) {
      throw new ForbiddenError('Not a board member');
    }

    await this.boardRepo.deleteLabel(input.labelId);

    this.realtimePublisher?.publish({
      boardId: input.boardId,
      event: 'board:updated',
      payload: { deletedLabelId: input.labelId },
    });
  }
}
