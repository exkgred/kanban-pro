export type ActivityType =
  | 'BOARD_CREATED'
  | 'BOARD_UPDATED'
  | 'COLUMN_CREATED'
  | 'COLUMN_UPDATED'
  | 'COLUMN_DELETED'
  | 'CARD_CREATED'
  | 'CARD_UPDATED'
  | 'CARD_MOVED'
  | 'CARD_DELETED'
  | 'MEMBER_ADDED'
  | 'LABEL_CREATED'
  | 'SPRINT_CREATED'
  | 'SPRINT_UPDATED'
  | 'TIMELOG_ADDED';

export interface Activity {
  id: string;
  boardId: string;
  cardId: string | null;
  actorId: string;
  type: ActivityType;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivityWithActor extends Activity {
  actor: { id: string; name: string; email: string };
}
