export interface TimeLogEntity {
  id: string;
  cardId: string;
  userId: string;
  description?: string | null;
  startTime: Date;
  endTime?: Date | null;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
