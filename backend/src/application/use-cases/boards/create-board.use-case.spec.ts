import { CreateBoardUseCase } from './create-board.use-case';
import { BoardRepository } from '../../../domain/repositories/board.repository';
import { ActivityRepository } from '../../../domain/repositories/activity.repository';
import { RealtimePublisher } from '../../interfaces/realtime-publisher';
import { Board, BoardMember } from '../../../domain/entities/board.entity';
import { Activity } from '../../../domain/entities/activity.entity';

describe('CreateBoardUseCase', () => {
  let useCase: CreateBoardUseCase;
  let boardRepo: jest.Mocked<BoardRepository>;
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

    activityRepo = {
      create: jest.fn(),
      listByBoard: jest.fn(),
    };

    realtimePublisher = {
      publish: jest.fn(),
    };

    useCase = new CreateBoardUseCase(
      boardRepo,
      activityRepo,
      realtimePublisher,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create board with valid data, add OWNER member, create columns, log activity and publish events', async () => {
    const mockBoard: Board = {
      id: 'board1',
      title: 'My Board',
      description: null,
      visibility: 'PRIVATE',
      ownerId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    boardRepo.create.mockResolvedValue(mockBoard);
    boardRepo.addMember.mockResolvedValue({} as BoardMember);
    boardRepo.createColumn.mockResolvedValue({
      id: 'col1',
      boardId: 'board1',
      title: 'To Do',
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockActivity: Activity = {
      id: 'act1',
      boardId: 'board1',
      actorId: 'user1',
      cardId: null,
      type: 'BOARD_CREATED',
      payload: { title: 'My Board' },
      createdAt: new Date(),
    };
    activityRepo.create.mockResolvedValue(mockActivity);

    const result = await useCase.execute({
      userId: 'user1',
      title: 'My Board',
    });

    expect(boardRepo.create).toHaveBeenCalledWith({
      title: 'My Board',
      description: null,
      visibility: 'PRIVATE',
      ownerId: 'user1',
    });

    expect(boardRepo.addMember).toHaveBeenCalledWith({
      boardId: 'board1',
      userId: 'user1',
      role: 'OWNER',
    });

    expect(boardRepo.createColumn).toHaveBeenCalledTimes(3);
    expect(boardRepo.createColumn).toHaveBeenNthCalledWith(1, {
      boardId: 'board1',
      title: 'To Do',
      position: 0,
    });
    expect(boardRepo.createColumn).toHaveBeenNthCalledWith(2, {
      boardId: 'board1',
      title: 'Doing',
      position: 1,
    });
    expect(boardRepo.createColumn).toHaveBeenNthCalledWith(3, {
      boardId: 'board1',
      title: 'Done',
      position: 2,
    });

    expect(activityRepo.create).toHaveBeenCalledWith({
      boardId: 'board1',
      actorId: 'user1',
      type: 'BOARD_CREATED',
      payload: { title: 'My Board' },
    });

    expect(realtimePublisher.publish).toHaveBeenCalledWith({
      boardId: 'board1',
      event: 'board:updated',
      payload: mockBoard,
    });
    expect(realtimePublisher.publish).toHaveBeenCalledWith({
      boardId: 'board1',
      event: 'activity:created',
      payload: mockActivity,
    });

    expect(result).toEqual(mockBoard);
  });
});
