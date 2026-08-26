export const REALTIME_PUBLISHER = Symbol('REALTIME_PUBLISHER');

export interface RealtimeEvent {
  boardId: string;
  event:
    | 'card:created'
    | 'card:updated'
    | 'card:moved'
    | 'card:deleted'
    | 'column:updated'
    | 'column:created'
    | 'column:deleted'
    | 'activity:created'
    | 'board:updated';
  payload: unknown;
}

export interface RealtimePublisher {
  publish(event: RealtimeEvent): void;
}
