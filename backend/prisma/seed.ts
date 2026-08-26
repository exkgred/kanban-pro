import { PrismaClient, type CardPriority, type SprintStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hoursAgo = (hours: number): Date =>
  new Date(Date.now() - hours * 60 * 60 * 1000);

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d;
};

async function main(): Promise<void> {
  const hash123 = await bcrypt.hash('password123', 10);
  const hashDemo = await bcrypt.hash('Demo1234!', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'demo@kanban.dev' },
    update: { name: 'Marina Alves', passwordHash: hashDemo },
    create: {
      name: 'Marina Alves',
      email: 'demo@kanban.dev',
      passwordHash: hashDemo,
    },
  });

  const teammate = await prisma.user.upsert({
    where: { email: 'demo@scrum.dev' },
    update: { name: 'Rafael Costa', passwordHash: hash123 },
    create: {
      name: 'Rafael Costa',
      email: 'demo@scrum.dev',
      passwordHash: hash123,
    },
  });

  const designer = await prisma.user.upsert({
    where: { email: 'ana@kanban.dev' },
    update: { name: 'Ana Souza', passwordHash: hashDemo },
    create: {
      name: 'Ana Souza',
      email: 'ana@kanban.dev',
      passwordHash: hashDemo,
    },
  });

  await prisma.board.deleteMany({
    where: {
      ownerId: { in: [owner.id, teammate.id] },
    },
  });

  const produto = await seedProdutoBoard(owner.id, teammate.id, designer.id);
  const marketing = await seedMarketingBoard(owner.id, designer.id);
  const infra = await seedInfraBoard(owner.id, teammate.id);

  console.log('Seed concluído:');
  console.log(`  - ${produto} (Produto)`);
  console.log(`  - ${marketing} (Marketing)`);
  console.log(`  - ${infra} (Infra)`);
  console.log('Logins:');
  console.log('  demo@kanban.dev / Demo1234!');
  console.log('  demo@scrum.dev  / password123');
  console.log('  ana@kanban.dev  / Demo1234!');
}

async function seedProdutoBoard(
  ownerId: string,
  teammateId: string,
  designerId: string,
): Promise<string> {
  const board = await prisma.board.create({
    data: {
      title: 'Produto MVP',
      description: 'Entrega do Kanban: sprints, tags e apontamento de horas',
      visibility: 'PRIVATE',
      ownerId,
      members: {
        create: [
          { userId: ownerId, role: 'OWNER' },
          { userId: teammateId, role: 'ADMIN' },
          { userId: designerId, role: 'MEMBER' },
        ],
      },
    },
  });

  const labels = await createLabels(board.id, [
    { name: 'bug', color: '#ef4444' },
    { name: 'feature', color: '#22c55e' },
    { name: 'melhoria', color: '#3b82f6' },
    { name: 'frontend', color: '#8b5cf6' },
    { name: 'backend', color: '#0ea5e9' },
    { name: 'design', color: '#ec4899' },
    { name: 'urgente', color: '#f97316' },
    { name: 'dívida técnica', color: '#64748b' },
  ]);

  const backlog = await prisma.column.create({
    data: { boardId: board.id, title: 'Backlog', position: 0 },
  });
  const todo = await prisma.column.create({
    data: { boardId: board.id, title: 'To Do', position: 1 },
  });
  const doing = await prisma.column.create({
    data: { boardId: board.id, title: 'Doing', position: 2 },
  });
  const review = await prisma.column.create({
    data: { boardId: board.id, title: 'Review', position: 3 },
  });
  const done = await prisma.column.create({
    data: { boardId: board.id, title: 'Done', position: 4 },
  });

  const sprint10 = await prisma.sprint.create({
    data: {
      boardId: board.id,
      name: 'Sprint 10 — Fundação',
      status: 'COMPLETED' satisfies SprintStatus,
      startDate: daysFromNow(-28),
      endDate: daysFromNow(-14),
    },
  });
  const sprint11 = await prisma.sprint.create({
    data: {
      boardId: board.id,
      name: 'Sprint 11 — Kanban ao vivo',
      status: 'ACTIVE' satisfies SprintStatus,
      startDate: daysFromNow(-7),
      endDate: daysFromNow(7),
    },
  });
  const sprint12 = await prisma.sprint.create({
    data: {
      boardId: board.id,
      name: 'Sprint 12 — Relatórios',
      status: 'PLANNED' satisfies SprintStatus,
      startDate: daysFromNow(8),
      endDate: daysFromNow(21),
    },
  });

  type CardSeed = {
    columnId: string;
    sprintId?: string;
    title: string;
    description: string;
    priority: CardPriority;
    dueDate?: Date;
    assigneeId?: string;
    estimatedHours: number;
    executedHours?: number;
    labelNames: string[];
    position: number;
    logs?: Array<{ userId: string; hours: number; description: string; hoursAgo: number }>;
  };

  const cards: CardSeed[] = [
    {
      columnId: done.id,
      sprintId: sprint10.id,
      title: 'Auth JWT (login / refresh / logout)',
      description: 'Sessão com access + refresh token e guard global.',
      priority: 'HIGH',
      assigneeId: teammateId,
      estimatedHours: 8,
      executedHours: 8.5,
      labelNames: ['feature', 'backend'],
      position: 0,
      logs: [
        { userId: teammateId, hours: 5, description: 'JWT + refresh', hoursAgo: 200 },
        { userId: ownerId, hours: 3.5, description: 'Guard e testes', hoursAgo: 180 },
      ],
    },
    {
      columnId: done.id,
      sprintId: sprint10.id,
      title: 'Schema Prisma do quadro',
      description: 'Board, Column, Card, Label e Activity no Postgres.',
      priority: 'MEDIUM',
      assigneeId: ownerId,
      estimatedHours: 6,
      executedHours: 5,
      labelNames: ['feature', 'backend'],
      position: 1,
      logs: [{ userId: ownerId, hours: 5, description: 'Modelo e índices', hoursAgo: 190 }],
    },
    {
      columnId: review.id,
      sprintId: sprint11.id,
      title: 'Modal do card com abas',
      description: 'Aba Detalhes (sprint, tags, horas) e aba de apontamento.',
      priority: 'HIGH',
      dueDate: daysFromNow(1),
      assigneeId: designerId,
      estimatedHours: 10,
      executedHours: 7,
      labelNames: ['feature', 'frontend', 'design'],
      position: 0,
      logs: [
        { userId: designerId, hours: 4, description: 'Layout das abas', hoursAgo: 20 },
        { userId: ownerId, hours: 3, description: 'Bind da API', hoursAgo: 8 },
      ],
    },
    {
      columnId: doing.id,
      sprintId: sprint11.id,
      title: 'Play/Pause de horas em tempo real',
      description: 'Start/stop de TimeLog e recálculo de executedHours no card.',
      priority: 'URGENT',
      dueDate: daysFromNow(0),
      assigneeId: ownerId,
      estimatedHours: 8,
      executedHours: 3.5,
      labelNames: ['feature', 'backend', 'urgente'],
      position: 0,
      logs: [{ userId: ownerId, hours: 3.5, description: 'Use cases start/stop', hoursAgo: 4 }],
    },
    {
      columnId: doing.id,
      sprintId: sprint11.id,
      title: 'Filtro de sprint e tags no quadro',
      description: 'Combos no header + modais Nova Sprint e Nova Tag.',
      priority: 'HIGH',
      dueDate: daysFromNow(2),
      assigneeId: designerId,
      estimatedHours: 6,
      executedHours: 2,
      labelNames: ['feature', 'frontend'],
      position: 1,
      logs: [{ userId: designerId, hours: 2, description: 'Selectors', hoursAgo: 6 }],
    },
    {
      columnId: todo.id,
      sprintId: sprint11.id,
      title: 'Indicador de horas no CardItem',
      description: 'Barra ⏱️ executadas / planejadas e ponto pulsante do timer.',
      priority: 'MEDIUM',
      dueDate: daysFromNow(3),
      assigneeId: designerId,
      estimatedHours: 4,
      executedHours: 0,
      labelNames: ['melhoria', 'frontend', 'design'],
      position: 0,
    },
    {
      columnId: todo.id,
      sprintId: sprint11.id,
      title: 'Validar drop zone do DnD',
      description: 'Highlight da coluna de destino e overlay do card arrastado.',
      priority: 'MEDIUM',
      dueDate: daysFromNow(4),
      assigneeId: teammateId,
      estimatedHours: 3,
      executedHours: 0,
      labelNames: ['melhoria', 'frontend'],
      position: 1,
    },
    {
      columnId: todo.id,
      sprintId: sprint11.id,
      title: 'Corrigir gate de autenticação (Carregando...)',
      description: 'isLoading nunca desligava sem refresh token; login ficava inacessível.',
      priority: 'URGENT',
      dueDate: daysFromNow(0),
      assigneeId: ownerId,
      estimatedHours: 2,
      executedHours: 1.5,
      labelNames: ['bug', 'frontend', 'urgente'],
      position: 2,
      logs: [{ userId: ownerId, hours: 1.5, description: 'AuthInitializer + finally', hoursAgo: 1 }],
    },
    {
      columnId: backlog.id,
      sprintId: sprint12.id,
      title: 'Burndown da sprint',
      description: 'Gráfico de horas planejadas vs executadas por dia da sprint.',
      priority: 'MEDIUM',
      assigneeId: teammateId,
      estimatedHours: 12,
      executedHours: 0,
      labelNames: ['feature', 'frontend', 'backend'],
      position: 0,
    },
    {
      columnId: backlog.id,
      sprintId: sprint12.id,
      title: 'Exportar apontamentos em CSV',
      description: 'Relatório por card, usuário e sprint.',
      priority: 'LOW',
      estimatedHours: 5,
      executedHours: 0,
      labelNames: ['feature', 'backend'],
      position: 1,
    },
    {
      columnId: backlog.id,
      title: 'Refatorar queries N+1 do board',
      description: 'Incluir labels, sprint e timer ativo em um único findMany.',
      priority: 'LOW',
      assigneeId: teammateId,
      estimatedHours: 4,
      executedHours: 0,
      labelNames: ['dívida técnica', 'backend'],
      position: 2,
    },
    {
      columnId: backlog.id,
      title: 'Empty state do quadro sem colunas',
      description: 'CTA para criar a primeira coluna quando o board é novo.',
      priority: 'LOW',
      estimatedHours: 2,
      executedHours: 0,
      labelNames: ['melhoria', 'frontend', 'design'],
      position: 3,
    },
  ];

  await createCards(board.id, labels, cards);
  await prisma.activity.create({
    data: {
      boardId: board.id,
      actorId: ownerId,
      type: 'BOARD_CREATED',
      payload: { title: board.title },
    },
  });
  return board.title;
}

async function seedMarketingBoard(ownerId: string, designerId: string): Promise<string> {
  const board = await prisma.board.create({
    data: {
      title: 'Marketing Q3',
      description: 'Campanhas, conteúdo e landing pages do trimestre',
      visibility: 'WORKSPACE',
      ownerId,
      members: {
        create: [
          { userId: ownerId, role: 'OWNER' },
          { userId: designerId, role: 'MEMBER' },
        ],
      },
    },
  });

  const labels = await createLabels(board.id, [
    { name: 'conteúdo', color: '#14b8a6' },
    { name: 'campanha', color: '#f59e0b' },
    { name: 'design', color: '#ec4899' },
    { name: 'urgente', color: '#ef4444' },
    { name: 'social', color: '#6366f1' },
  ]);

  const ideias = await prisma.column.create({
    data: { boardId: board.id, title: 'Ideias', position: 0 },
  });
  const producao = await prisma.column.create({
    data: { boardId: board.id, title: 'Em produção', position: 1 },
  });
  const publicado = await prisma.column.create({
    data: { boardId: board.id, title: 'Publicado', position: 2 },
  });

  const sprint = await prisma.sprint.create({
    data: {
      boardId: board.id,
      name: 'Sprint Conteúdo — Agosto',
      status: 'ACTIVE' satisfies SprintStatus,
      startDate: daysFromNow(-5),
      endDate: daysFromNow(9),
    },
  });

  await createCards(board.id, labels, [
    {
      columnId: publicado.id,
      sprintId: sprint.id,
      title: 'Post LinkedIn: lançamento do Kanban',
      description: 'Copy + arte 1200x627 e agendamento.',
      priority: 'MEDIUM',
      assigneeId: designerId,
      estimatedHours: 3,
      executedHours: 3,
      labelNames: ['conteúdo', 'social', 'design'],
      position: 0,
      logs: [{ userId: designerId, hours: 3, description: 'Copy e arte', hoursAgo: 48 }],
    },
    {
      columnId: producao.id,
      sprintId: sprint.id,
      title: 'Landing page da campanha piloto',
      description: 'Hero, prova social e CTA para trial.',
      priority: 'HIGH',
      dueDate: daysFromNow(5),
      assigneeId: designerId,
      estimatedHours: 16,
      executedHours: 6,
      labelNames: ['campanha', 'design'],
      position: 0,
      logs: [{ userId: designerId, hours: 6, description: 'Wireframe + hero', hoursAgo: 12 }],
    },
    {
      columnId: producao.id,
      sprintId: sprint.id,
      title: 'Sequência de e-mail onboarding',
      description: '3 e-mails: bem-vindo, primeiro board, convite time.',
      priority: 'HIGH',
      dueDate: daysFromNow(6),
      assigneeId: ownerId,
      estimatedHours: 8,
      executedHours: 2,
      labelNames: ['campanha', 'conteúdo'],
      position: 1,
      logs: [{ userId: ownerId, hours: 2, description: 'Roteiro dos 3 e-mails', hoursAgo: 10 }],
    },
    {
      columnId: ideias.id,
      sprintId: sprint.id,
      title: 'Webinar “Scrum no Kanban”',
      description: 'Pauta de 40 min + convite para lista.',
      priority: 'LOW',
      estimatedHours: 10,
      executedHours: 0,
      labelNames: ['conteúdo', 'campanha'],
      position: 0,
    },
    {
      columnId: ideias.id,
      title: 'Kit de marca para parceiros',
      description: 'Logo, cores e exemplos de menção.',
      priority: 'LOW',
      assigneeId: designerId,
      estimatedHours: 5,
      executedHours: 0,
      labelNames: ['design'],
      position: 1,
    },
    {
      columnId: ideias.id,
      title: 'Anúncio pago — teste A/B de CTA',
      description: 'Variantes “Começar grátis” vs “Ver demo”.',
      priority: 'MEDIUM',
      dueDate: daysFromNow(10),
      estimatedHours: 4,
      executedHours: 0,
      labelNames: ['campanha', 'urgente'],
      position: 2,
    },
  ]);

  await prisma.activity.create({
    data: {
      boardId: board.id,
      actorId: ownerId,
      type: 'BOARD_CREATED',
      payload: { title: board.title },
    },
  });
  return board.title;
}

async function seedInfraBoard(ownerId: string, teammateId: string): Promise<string> {
  const board = await prisma.board.create({
    data: {
      title: 'Infra & DevOps',
      description: 'CI, observabilidade e ambiente local',
      visibility: 'PRIVATE',
      ownerId,
      members: {
        create: [
          { userId: ownerId, role: 'OWNER' },
          { userId: teammateId, role: 'ADMIN' },
        ],
      },
    },
  });

  const labels = await createLabels(board.id, [
    { name: 'ci', color: '#22c55e' },
    { name: 'infra', color: '#64748b' },
    { name: 'segurança', color: '#ef4444' },
    { name: 'bug', color: '#f97316' },
    { name: 'docs', color: '#3b82f6' },
  ]);

  const todo = await prisma.column.create({
    data: { boardId: board.id, title: 'A fazer', position: 0 },
  });
  const doing = await prisma.column.create({
    data: { boardId: board.id, title: 'Em andamento', position: 1 },
  });
  const done = await prisma.column.create({
    data: { boardId: board.id, title: 'Concluído', position: 2 },
  });

  const sprint = await prisma.sprint.create({
    data: {
      boardId: board.id,
      name: 'Sprint Ops — Semana 34',
      status: 'ACTIVE' satisfies SprintStatus,
      startDate: daysFromNow(-3),
      endDate: daysFromNow(4),
    },
  });
  await prisma.sprint.create({
    data: {
      boardId: board.id,
      name: 'Sprint Ops — Semana 35',
      status: 'PLANNED' satisfies SprintStatus,
      startDate: daysFromNow(5),
      endDate: daysFromNow(12),
    },
  });

  await createCards(board.id, labels, [
    {
      columnId: done.id,
      sprintId: sprint.id,
      title: 'Postgres 16 no Docker Compose',
      description: 'Serviço na porta 5434 para não conflitar com o MySQL local.',
      priority: 'HIGH',
      assigneeId: teammateId,
      estimatedHours: 2,
      executedHours: 2,
      labelNames: ['infra', 'ci'],
      position: 0,
      logs: [{ userId: teammateId, hours: 2, description: 'compose + healthcheck', hoursAgo: 72 }],
    },
    {
      columnId: doing.id,
      sprintId: sprint.id,
      title: 'Pipeline lint + testes no GitHub Actions',
      description: 'backend npm test e frontend tsc --noEmit.',
      priority: 'HIGH',
      dueDate: daysFromNow(2),
      assigneeId: teammateId,
      estimatedHours: 6,
      executedHours: 2.5,
      labelNames: ['ci', 'infra'],
      position: 0,
      logs: [{ userId: teammateId, hours: 2.5, description: 'workflow inicial', hoursAgo: 9 }],
    },
    {
      columnId: todo.id,
      sprintId: sprint.id,
      title: 'Rotação de secrets JWT em staging',
      description: 'ACCESS/REFRESH distintos e rotação sem downtime.',
      priority: 'URGENT',
      dueDate: daysFromNow(1),
      assigneeId: ownerId,
      estimatedHours: 4,
      executedHours: 0,
      labelNames: ['segurança', 'infra'],
      position: 0,
    },
    {
      columnId: todo.id,
      sprintId: sprint.id,
      title: 'README de ambiente local',
      description: 'Passo a passo Docker, seed e contas demo.',
      priority: 'LOW',
      assigneeId: ownerId,
      estimatedHours: 1.5,
      executedHours: 0,
      labelNames: ['docs'],
      position: 1,
    },
    {
      columnId: todo.id,
      title: 'Investigar timeout intermitente no healthcheck',
      description: 'Ocorre só no CI; local passa sempre.',
      priority: 'MEDIUM',
      assigneeId: teammateId,
      estimatedHours: 3,
      executedHours: 0,
      labelNames: ['bug', 'ci'],
      position: 2,
    },
  ]);

  await prisma.activity.create({
    data: {
      boardId: board.id,
      actorId: ownerId,
      type: 'BOARD_CREATED',
      payload: { title: board.title },
    },
  });
  return board.title;
}

async function createLabels(
  boardId: string,
  items: Array<{ name: string; color: string }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const item of items) {
    const label = await prisma.label.create({
      data: { boardId, name: item.name, color: item.color },
    });
    map.set(item.name, label.id);
  }
  return map;
}

async function createCards(
  boardId: string,
  labels: Map<string, string>,
  cards: Array<{
    columnId: string;
    sprintId?: string;
    title: string;
    description: string;
    priority: CardPriority;
    dueDate?: Date;
    assigneeId?: string;
    estimatedHours: number;
    executedHours?: number;
    labelNames: string[];
    position: number;
    logs?: Array<{ userId: string; hours: number; description: string; hoursAgo: number }>;
  }>,
): Promise<void> {
  for (const card of cards) {
    const labelIds = card.labelNames
      .map((name) => labels.get(name))
      .filter((id): id is string => Boolean(id));

    const created = await prisma.card.create({
      data: {
        boardId,
        columnId: card.columnId,
        sprintId: card.sprintId ?? null,
        title: card.title,
        description: card.description,
        priority: card.priority,
        dueDate: card.dueDate ?? null,
        assigneeId: card.assigneeId ?? null,
        position: card.position,
        estimatedHours: card.estimatedHours,
        executedHours: card.executedHours ?? 0,
        labels:
          labelIds.length > 0
            ? { create: labelIds.map((labelId) => ({ labelId })) }
            : undefined,
      },
    });

    if (card.logs) {
      for (const log of card.logs) {
        const durationSeconds = Math.round(log.hours * 3600);
        const startTime = hoursAgo(log.hoursAgo);
        await prisma.timeLog.create({
          data: {
            cardId: created.id,
            userId: log.userId,
            description: log.description,
            startTime,
            endTime: new Date(startTime.getTime() + durationSeconds * 1000),
            durationSeconds,
          },
        });
      }
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
