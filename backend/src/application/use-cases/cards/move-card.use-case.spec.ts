import { MoveCardUseCase } from './move-card.use-case';
import { BoardRepository } from '../../../domain/repositories/board.repository';
import { CardRepository } from '../../../domain/repositories/card.repository';
import { ActivityRepository } from '../../../domain/repositories/activity.repository';
import { RealtimePublisher } from '../../interfaces/realtime-publisher';
import { CardWithLabels } from '../../../domain/entities/card.entity';
import { Activity } from '../../../domain/entities/activity.entity';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../domain/errors/domain-error';
import { BoardMember, Column } from '../../../domain/entities/board.entity';

describe('MoveCardUseCase', () => {
  let useCase: MoveCardUseCase;
  let boardRepo: jest.Mocked<BoardRepository>;
  let cardRepo: jest.Mocked<CardRepository>;
  let activityRepo: jest.Mocked<ActivityRepository>;
  let realtimePublisher: jest.Mocked<RealtimePublisher>;

  beforeEach(() => {
    boardRepo = {
      findById: jest.fn(),
      findDetailById: jest.fn(),
      listForUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMembership: jest.fn(),
      addMember: jest.fn(),
      createColumn: jest.fn(),
      findColumn: jest.fn(),
      updateColumn: jest.fn(),
      deleteColumn: jest.fn(),
      reorderColumns: jest.fn(),
      nextColumnPosition: jest.fn(),
      createLabel: jest.fn(),
      listLabels: jest.fn(),
      deleteLabel: jest.fn(),
    };

    cardRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      listByBoard: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      move: jest.fn(),
      nextPosition: jest.fn(),
    };

    activityRepo = {
      create: jest.fn(),
      listByBoard: jest.fn(),
    };

    realtimePublisher = {
      publish: jest.fn(),
    };

    useCase = new MoveCardUseCase(
      boardRepo,
      cardRepo,
      activityRepo,
      realtimePublisher,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should move card to new column successfully', async () => {
    const mockMembership = { role: 'MEMBER' } as BoardMember;
    boardRepo.getMembership.mockResolvedValue(mockMembership);

    const mockExistingCard = {
      id: 'card1',
      columnId: 'col1',
      position: 0,
    } as CardWithLabels;
    cardRepo.findById.mockResolvedValue(mockExistingCard);

    const mockTargetColumn = { id: 'col2' } as Column;
    boardRepo.findColumn.mockResolvedValue(mockTargetColumn);

    const mockMovedCard = {
      id: 'card1',
      columnId: 'col2',
      position: 1,
    } as CardWithLabels;
    cardRepo.move.mockResolvedValue(mockMovedCard);

    const mockActivity = { id: 'act1', cardId: 'card1' } as Activity;
    activityRepo.create.mockResolvedValue(mockActivity);

    const result = await useCase.execute({
      boardId: 'board1',
      cardId: 'card1',
      userId: 'user1',
      columnId: 'col2',
      position: 1,
    });

    expect(boardRepo.getMembership).toHaveBeenCalledWith('board1', 'user1');
    expect(cardRepo.findById).toHaveBeenCalledWith('board1', 'card1');
    expect(boardRepo.findColumn).toHaveBeenCalledWith('board1', 'col2');

    expect(cardRepo.move).toHaveBeenCalledWith({
      cardId: 'card1',
      fromColumnId: 'col1',
      toColumnId: 'col2',
      toPosition: 1,
    });

    expect(activityRepo.create).toHaveBeenCalledWith({
      boardId: 'board1',
      cardId: 'card1',
      actorId: 'user1',
      type: 'CARD_MOVED',
      payload: {
        cardId: 'card1',
        fromColumnId: 'col1',
        toColumnId: 'col2',
        position: 1,
      },
    });

    expect(realtimePublisher.publish).toHaveBeenCalledWith({
      boardId: 'board1',
      event: 'card:moved',
      payload: mockMovedCard,
    });

    expect(result).toEqual(mockMovedCard);
  });

  it('should throw ForbiddenError if not a board member', async () => {
    boardRepo.getMembership.mockResolvedValue(null);

    await expect(
      useCase.execute({
        boardId: 'board1',
        cardId: 'card1',
        userId: 'user1',
        columnId: 'col2',
        position: 1,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ValidationError if position is less than 0', async () => {
    const mockMembership = { role: 'MEMBER' } as BoardMember;
    boardRepo.getMembership.mockResolvedValue(mockMembership);

    await expect(
      useCase.execute({
        boardId: 'board1',
        cardId: 'card1',
        userId: 'user1',
        columnId: 'col2',
        position: -1,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw NotFoundError if card does not exist', async () => {
    const mockMembership = { role: 'MEMBER' } as BoardMember;
    boardRepo.getMembership.mockResolvedValue(mockMembership);

    cardRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        boardId: 'board1',
        cardId: 'card1',
        userId: 'user1',
        columnId: 'col2',
        position: 1,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw NotFoundError if target column does not exist', async () => {
    const mockMembership = { role: 'MEMBER' } as BoardMember;
    boardRepo.getMembership.mockResolvedValue(mockMembership);

    const mockExistingCard = {
      id: 'card1',
      columnId: 'col1',
      position: 0,
    } as CardWithLabels;
    cardRepo.findById.mockResolvedValue(mockExistingCard);

    boardRepo.findColumn.mockResolvedValue(null);

    await expect(
      useCase.execute({
        boardId: 'board1',
        cardId: 'card1',
        userId: 'user1',
        columnId: 'col2',
        position: 1,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
