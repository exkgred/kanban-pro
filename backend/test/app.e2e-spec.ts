import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DomainExceptionFilter } from '../src/presentation/filters/domain-exception.filter';
import { ResponseInterceptor } from '../src/presentation/interceptors/response.interceptor';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Kanban API E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const uniqueId = Date.now();
  const testUser = {
    name: 'Test User',
    email: `test${uniqueId}@example.com`,
    password: 'password123',
  };

  let accessToken: string;
  let refreshToken: string;
  let boardId: string;
  let columnId1: string;
  let columnId2: string;
  let cardId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany({
      where: { actor: { email: testUser.email } },
    });
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    if (user) {
      await prisma.card.deleteMany({
        where: { column: { board: { ownerId: user.id } } },
      });
      await prisma.column.deleteMany({
        where: { board: { ownerId: user.id } },
      });
      await prisma.boardMember.deleteMany({ where: { userId: user.id } });
      await prisma.board.deleteMany({ where: { ownerId: user.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }

    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/v1/auth/register — registra usuário', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.tokens).toBeDefined();
    });

    it('POST /api/v1/auth/register — erro: email duplicado', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /api/v1/auth/login — login com credenciais válidas', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.data.tokens).toBeDefined();
      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('POST /api/v1/auth/login — erro: senha inválida', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrong_password',
        })
        .expect(401);
    });

    it('GET /api/v1/auth/me — retorna usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.email).toBe(testUser.email);
    });

    it('POST /api/v1/auth/refresh — rotaciona refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('POST /api/v1/auth/logout — revoga refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      accessToken = res.body.data.tokens.accessToken;
    });
  });

  describe('Boards', () => {
    it('POST /api/v1/boards — cria board', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Board',
          description: 'Test board',
        })
        .expect(201);

      expect(response.body.data.id).toBeDefined();
      boardId = response.body.data.id;
    });

    it('GET /api/v1/boards — lista boards do usuário', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/boards/:id — detalhe do board', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(boardId);
      expect(response.body.data.columns).toBeDefined();

      columnId1 = response.body.data.columns[0].id;
      columnId2 = response.body.data.columns[1].id;
    });

    it('PATCH /api/v1/boards/:id — atualiza board', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated E2E Board',
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated E2E Board');
    });

    it('POST /api/v1/boards/:id/members — adiciona membro', async () => {
      const memberUser = {
        email: `member${uniqueId}@example.com`,
        name: 'Member',
        password: 'pwd',
      };
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(memberUser);

      await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: memberUser.email,
        })
        .expect(201);

      const member = await prisma.user.findUnique({
        where: { email: memberUser.email },
      });
      if (member) {
        await prisma.boardMember.deleteMany({ where: { userId: member.id } });
        await prisma.user.delete({ where: { id: member.id } });
      }
    });
  });

  describe('Columns', () => {
    it('POST /api/v1/boards/:id/columns — cria coluna', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/columns`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'New Column',
        })
        .expect(201);

      expect(response.body.data.id).toBeDefined();
    });

    it('PATCH /api/v1/boards/:id/columns/:colId — atualiza coluna', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/boards/${boardId}/columns/${columnId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Column',
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Column');
    });

    it('PATCH /api/v1/boards/:id/columns/reorder — reordena', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/boards/${boardId}/columns/reorder`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          items: [
            { id: columnId1, position: 1 },
            { id: columnId2, position: 0 },
          ],
        })
        .expect(200);
    });
  });

  describe('Cards', () => {
    it('POST /api/v1/boards/:id/cards — cria card', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/cards`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          columnId: columnId1,
          title: 'E2E Card',
          description: 'E2E Description',
        })
        .expect(201);

      expect(response.body.data.id).toBeDefined();
      cardId = response.body.data.id;
    });

    it('GET /api/v1/boards/:id/cards — lista cards', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/cards`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.some((c: any) => c.id === cardId)).toBe(true);
    });

    it('PATCH /api/v1/boards/:id/cards/:cardId — atualiza card', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/boards/${boardId}/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated E2E Card',
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated E2E Card');
    });

    it('POST /api/v1/boards/:id/cards/:cardId/move — move card', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/boards/${boardId}/cards/${cardId}/move`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          columnId: columnId2,
          position: 0,
        })
        .expect(201);

      expect(response.body.data.columnId).toBe(columnId2);
    });

    it('DELETE /api/v1/boards/:id/cards/:cardId — remove card', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/boards/${boardId}/cards/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/cards`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.body.data.some((c: any) => c.id === cardId)).toBe(false);
    });
  });

  describe('Activities', () => {
    it('GET /api/v1/boards/:id/activities — lista atividades', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/boards/${boardId}/activities`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
