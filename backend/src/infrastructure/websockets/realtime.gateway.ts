import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../application/interfaces/auth.interfaces';
import {
  BOARD_REPOSITORY,
  type BoardRepository,
} from '../../domain/repositories/board.repository';
import { Inject } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(BOARD_REPOSITORY) private readonly boards: BoardRepository,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      this.extractBearer(client.handshake.headers.authorization);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.tokens.verifyAccess(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('board:join')
  async joinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { boardId: string },
  ): Promise<{ ok: boolean }> {
    const userId = client.data.userId as string | undefined;
    if (!userId || !body?.boardId) {
      return { ok: false };
    }
    const membership = await this.boards.getMembership(body.boardId, userId);
    if (!membership) {
      return { ok: false };
    }
    await client.join(`board:${body.boardId}`);
    return { ok: true };
  }

  @SubscribeMessage('board:leave')
  async leaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { boardId: string },
  ): Promise<{ ok: boolean }> {
    if (body?.boardId) {
      await client.leave(`board:${body.boardId}`);
    }
    return { ok: true };
  }

  emitToBoard(boardId: string, event: string, payload: unknown): void {
    this.server.to(`board:${boardId}`).emit(event, payload);
  }

  private extractBearer(header?: string): string | undefined {
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice(7);
  }
}
