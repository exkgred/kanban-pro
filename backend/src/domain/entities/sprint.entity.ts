export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface SprintEntity {
  id: string;
  boardId: string;
  name: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status: SprintStatus;
  createdAt: Date;
  updatedAt: Date;
}
