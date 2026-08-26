import { ReorderColumnsUseCase } from './reorder-columns.use-case';
import { BoardRepository } from '../../../domain/repositories/board.repository';
import { ActivityRepository } from '../../../domain/repositories/activity.repository';
import { RealtimePublisher } from '../../interfaces/realtime-publisher';
import { ForbiddenError } from '../../../domain/errors/domain-error';
import { BoardMember, Column } from '../../../domain/entities/board.entity';
import { Activity } from '../../../domain/entities/activity.entity';

describe('ReorderColumnsUseCase', () => {
  let useCase: ReorderColumnsUseCase;
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

    useCase = new ReorderColumnsUseCase(
      boardRepo,
      activityRepo,
      realtimePublisher,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reorder columns with valid positions', async () => {
    const mockMembership = { role: 'MEMBER' } as BoardMember;
    boardRepo.getMembership.mockResolvedValue(mockMembership);

    const mockColumns = [
      { id: 'col1', position: 1 },
      { id: 'col2', position: 0 },
    ] as Column[];
    boardRepo.reorderColumns.mockResolvedValue(mockColumns);

    const mockActivity = { id: 'act1', cardId: null } as Activity;
    activityRepo.create.mockResolvedValue(mockActivity);

    const inputItems = [
      { id: 'col1', position: 1 },
      { id: 'col2', position: 0 },
    ];
    const result = await useCase.execute({
      boardId: 'board1',
      userId: 'user1',
      items: inputItems,
    });

    expect(boardRepo.getMembership).toHaveBeenCalledWith('board1', 'user1');
    expect(boardRepo.reorderColumns).toHaveBeenCalledWith('board1', inputItems);

    expect(activityRepo.create).toHaveBeenCalledWith({
      boardId: 'board1',
      actorId: 'user1',
      type: 'COLUMN_UPDATED',
      payload: { reorder: inputItems },
    });

    expect(realtimePublisher.publish).toHaveBeenCalledWith({
      boardId: 'board1',
      event: 'column:updated',
      payload: mockColumns,
    });

    expect(result).toEqual(mockColumns);
  });

  it('should throw ForbiddenError if user is not a board member', async () => {
    boardRepo.getMembership.mockResolvedValue(null);

    await expect(
      useCase.execute({
        boardId: 'board1',
        userId: 'user1',
        items: [{ id: 'col1', position: 0 }],
      }),
    ).rejects.toThrow(ForbiddenError);

    expect(boardRepo.reorderColumns).not.toHaveBeenCalled();
  });
});
