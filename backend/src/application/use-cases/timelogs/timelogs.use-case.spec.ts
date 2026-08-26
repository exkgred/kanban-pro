import { StartTimeLogUseCase } from './start-timelog.use-case';
import { StopTimeLogUseCase } from './stop-timelog.use-case';
import { AddManualTimeLogUseCase } from './add-manual-timelog.use-case';
import { BoardRepository } from '../../../domain/repositories/board.repository';
import { CardRepository } from '../../../domain/repositories/card.repository';
import { TimeLogRepository } from '../../../domain/repositories/timelog.repository';
import { TimeLogEntity } from '../../../domain/entities/timelog.entity';
import { CardWithLabels } from '../../../domain/entities/card.entity';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../domain/errors/domain-error';
import { BoardMember } from '../../../domain/entities/board.entity';
import { RealtimePublisher } from '../../interfaces/realtime-publisher';

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

function mockCardRepo(): jest.Mocked<CardRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    listByBoard: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    move: jest.fn(),
    nextPosition: jest.fn(),
  };
}

function mockTimeLogRepo(): jest.Mocked<TimeLogRepository> {
  return {
    findById: jest.fn(),
    findByCardId: jest.fn(),
    findActiveByCardAndUser: jest.fn(),
    create: jest.fn(),
    stop: jest.fn(),
    delete: jest.fn(),
    getTotalExecutedHoursByCard: jest.fn(),
  };
}

const membership = {
  boardId: 'b1',
  userId: 'u1',
  role: 'MEMBER',
} as BoardMember;

const card = {
  id: 'c1',
  boardId: 'b1',
  columnId: 'col1',
  title: 'Task',
  estimatedHours: 8,
  executedHours: 0,
  labels: [],
} as unknown as CardWithLabels;

const runningLog: TimeLogEntity = {
  id: 't1',
  cardId: 'c1',
  userId: 'u1',
  description: 'coding',
  startTime: new Date(Date.now() - 10_000),
  endTime: null,
  durationSeconds: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StartTimeLogUseCase', () => {
  let useCase: StartTimeLogUseCase;
  let timeLogRepo: jest.Mocked<TimeLogRepository>;
  let cardRepo: jest.Mocked<CardRepository>;
  let boardRepo: jest.Mocked<BoardRepository>;
  let realtime: jest.Mocked<RealtimePublisher>;

  beforeEach(() => {
    timeLogRepo = mockTimeLogRepo();
    cardRepo = mockCardRepo();
    boardRepo = mockBoardRepo();
    realtime = { publish: jest.fn() };
    useCase = new StartTimeLogUseCase(
      timeLogRepo,
      cardRepo,
      boardRepo,
      realtime,
    );
  });

  it('Play → inicia cronômetro', async () => {
    boardRepo.getMembership.mockResolvedValue(membership);
    cardRepo.findById.mockResolvedValue(card);
    timeLogRepo.findActiveByCardAndUser.mockResolvedValue(null);
    timeLogRepo.create.mockResolvedValue(runningLog);

    const result = await useCase.execute({
      boardId: 'b1',
      cardId: 'c1',
      userId: 'u1',
      description: 'coding',
    });

    expect(timeLogRepo.create).toHaveBeenCalled();
    expect(result.id).toBe('t1');
    expect(realtime.publish).toHaveBeenCalled();
  });

  it('já existe timer ativo → ValidationError', async () => {
    boardRepo.getMembership.mockResolvedValue(membership);
    cardRepo.findById.mockResolvedValue(card);
    timeLogRepo.findActiveByCardAndUser.mockResolvedValue(runningLog);

    await expect(
      useCase.execute({ boardId: 'b1', cardId: 'c1', userId: 'u1' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('usuário sem acesso → ForbiddenError', async () => {
    boardRepo.getMembership.mockResolvedValue(null);

    await expect(
      useCase.execute({ boardId: 'b1', cardId: 'c1', userId: 'u2' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('StopTimeLogUseCase', () => {
  it('Pause → calcula segundos e incrementa executedHours', async () => {
    const timeLogRepo = mockTimeLogRepo();
    const cardRepo = mockCardRepo();
    const boardRepo = mockBoardRepo();
    const realtime: jest.Mocked<RealtimePublisher> = { publish: jest.fn() };
    boardRepo.getMembership.mockResolvedValue(membership);
    timeLogRepo.findById.mockResolvedValue(runningLog);
    const stopped = {
      ...runningLog,
      endTime: new Date(),
      durationSeconds: 10,
    };
    timeLogRepo.stop.mockResolvedValue(stopped);
    timeLogRepo.getTotalExecutedHoursByCard.mockResolvedValue(0.01);
    cardRepo.update.mockResolvedValue({ ...card, executedHours: 0.01 });

    const result = await new StopTimeLogUseCase(
      timeLogRepo,
      cardRepo,
      boardRepo,
      realtime,
    ).execute({
      boardId: 'b1',
      cardId: 'c1',
      timeLogId: 't1',
      userId: 'u1',
    });

    expect(timeLogRepo.stop).toHaveBeenCalled();
    expect(cardRepo.update).toHaveBeenCalledWith('c1', { executedHours: 0.01 });
    expect(result.executedHours).toBe(0.01);
    expect(realtime.publish).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'card:updated' }),
    );
  });

  it('timer já finalizado → ValidationError', async () => {
    const timeLogRepo = mockTimeLogRepo();
    const cardRepo = mockCardRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    timeLogRepo.findById.mockResolvedValue({
      ...runningLog,
      endTime: new Date(),
    });

    await expect(
      new StopTimeLogUseCase(timeLogRepo, cardRepo, boardRepo).execute({
        boardId: 'b1',
        cardId: 'c1',
        timeLogId: 't1',
        userId: 'u1',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('registro inexistente → NotFoundError', async () => {
    const timeLogRepo = mockTimeLogRepo();
    const cardRepo = mockCardRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    timeLogRepo.findById.mockResolvedValue(null);

    await expect(
      new StopTimeLogUseCase(timeLogRepo, cardRepo, boardRepo).execute({
        boardId: 'b1',
        cardId: 'c1',
        timeLogId: 'missing',
        userId: 'u1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('AddManualTimeLogUseCase', () => {
  it('apontamento manual → soma horas no card', async () => {
    const timeLogRepo = mockTimeLogRepo();
    const cardRepo = mockCardRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    cardRepo.findById.mockResolvedValue(card);
    timeLogRepo.create.mockResolvedValue({
      ...runningLog,
      endTime: new Date(),
      durationSeconds: 9000,
    });
    timeLogRepo.getTotalExecutedHoursByCard.mockResolvedValue(2.5);
    cardRepo.update.mockResolvedValue({ ...card, executedHours: 2.5 });

    const result = await new AddManualTimeLogUseCase(
      timeLogRepo,
      cardRepo,
      boardRepo,
    ).execute({
      boardId: 'b1',
      cardId: 'c1',
      userId: 'u1',
      hours: 2.5,
      description: 'reunião',
    });

    expect(result.executedHours).toBe(2.5);
    expect(cardRepo.update).toHaveBeenCalledWith('c1', { executedHours: 2.5 });
  });

  it('horas zeradas → ValidationError', async () => {
    const timeLogRepo = mockTimeLogRepo();
    const cardRepo = mockCardRepo();
    const boardRepo = mockBoardRepo();
    boardRepo.getMembership.mockResolvedValue(membership);
    cardRepo.findById.mockResolvedValue(card);

    await expect(
      new AddManualTimeLogUseCase(timeLogRepo, cardRepo, boardRepo).execute({
        boardId: 'b1',
        cardId: 'c1',
        userId: 'u1',
        hours: 0,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
