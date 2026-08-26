import { Injectable } from '@nestjs/common';
import type {
  RealtimeEvent,
  RealtimePublisher,
} from '../../application/interfaces/realtime-publisher';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class SocketRealtimePublisher implements RealtimePublisher {
  constructor(private readonly gateway: RealtimeGateway) {}

  publish(event: RealtimeEvent): void {
    this.gateway.emitToBoard(event.boardId, event.event, event.payload);
  }
}
