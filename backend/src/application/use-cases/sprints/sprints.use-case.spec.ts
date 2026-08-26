import { CreateSprintUseCase } from './create-sprint.use-case';
import { ListSprintsUseCase } from './list-sprints.use-case';
import { UpdateSprintUseCase } from './update-sprint.use-case';
import { DeleteSprintUseCase } from './delete-sprint.use-case';
import { BoardRepository } from '../../../domain/repositories/board.repository';
import { SprintRepository } from '../../../domain/repositories/sprint.repository';
import {
  SprintEntity,
  SprintStatus,
} from '../../../domain/entities/sprint.entity';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../domain/errors/domain-error';
import { BoardMember } from '../../../domain/entities/board.entity';

function mockBoardRepo(): jest.Mocked<BoardRepository> {
  return {
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
}

function mockSprintRepo(): jest.Mocked<SprintRepository> {
  return {
    findById: jest.fn(),
    findByBoardId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

const membership = {
  boardId: 'b1',
  userId: 'u1',
  role: 'MEMBER',
} as BoardMember;

const sprint: SprintEntity = {
  id: 's1',
  boardId: 'b1',
  name: 'Sprint 1',
  startDate: new Date('2026-08-01'),
  endDate: new Date('2026-08-15'),
  status: SprintStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CreateSprintUseCase', () => {
  let useCase: CreateSprintUseCase;
  let sprintRepo: jest.Mocked<SprintRepository>;
  let boardRepo: jest.Mocked<BoardRepository>;

  beforeEach(() => {
    sprintRepo = mockSprintRepo();
    boardRepo = mockBoardRepo();
    useCase = new CreateSprintUseCase(sprintRepo, boardRepo);
  });

  it('membro do board → cria sprint', async () => {
    boardRepo.getMembership.mockResolvedValue(membership);
    sprintRepo.create.mockResolvedValue(sprint);

    const result = await useCase.execute({
      boardId: 'b1',
      userId: 'u1',
      name: 'Sprint 1',
      status: SprintStatus.ACTIVE,
    });

    expect(sprintRepo.create).toHaveBeenCalledWith({
      boardId: 'b1',
      name: 'Sprint 1',
      startDate: undefined,
      endDate: undefined,
      status: SprintStatus.ACTIVE,
    });
    expect(result).toEqual(sprint);
  });

  it('usuário sem acesso → ForbiddenError', async () => {
    boardRepo.getMembership.mockResolvedValue(null);

    await expect(
      useCase.execute({ boardId: 'b1', userId: 'u2', name: 'Sprint 1' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(sprintRepo.create).not.toHaveBeenCalled();
  });
});

describe('ListSprintsUseCase', () => {
  it('membro → lista sprints do board', async () => {
    const sprintRepo = mockSprintRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    sprintRepo.findByBoardId.mockResolvedValue([sprint]);

    const result = await new ListSprintsUseCase(sprintRepo, boardRepo).execute(
      'b1',
      'u1',
    );

    expect(result).toEqual([sprint]);
  });
});

describe('UpdateSprintUseCase', () => {
  it('sprint de outro board → NotFoundError', async () => {
    const sprintRepo = mockSprintRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    sprintRepo.findById.mockResolvedValue({ ...sprint, boardId: 'other' });

    await expect(
      new UpdateSprintUseCase(sprintRepo, boardRepo).execute({
        boardId: 'b1',
        sprintId: 's1',
        userId: 'u1',
        data: { name: 'X' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('DeleteSprintUseCase', () => {
  it('sprint inexistente → NotFoundError', async () => {
    const sprintRepo = mockSprintRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    sprintRepo.findById.mockResolvedValue(null);

    await expect(
      new DeleteSprintUseCase(sprintRepo, boardRepo).execute({
        boardId: 'b1',
        sprintId: 's1',
        userId: 'u1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
