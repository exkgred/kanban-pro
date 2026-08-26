'use client';

import { useBoardStore } from '../../stores/board-store';
import { Activity } from '../../types';

const activityLabel: Record<string, string> = {
  BOARD_CREATED: 'Board criado',
  BOARD_UPDATED: 'Board atualizado',
  COLUMN_CREATED: 'Coluna criada',
  COLUMN_UPDATED: 'Coluna atualizada',
  COLUMN_DELETED: 'Coluna excluída',
  CARD_CREATED: 'Card criado',
  CARD_UPDATED: 'Card atualizado',
  CARD_MOVED: 'Card movido',
  CARD_DELETED: 'Card excluído',
  MEMBER_ADDED: 'Membro adicionado',
  LABEL_CREATED: 'Label criado',
};

const activityIcon: Record<string, string> = {
  BOARD_CREATED: '🗂️',
  BOARD_UPDATED: '✏️',
  COLUMN_CREATED: '➕',
  COLUMN_UPDATED: '✏️',
  COLUMN_DELETED: '🗑️',
  CARD_CREATED: '🃏',
  CARD_UPDATED: '✏️',
  CARD_MOVED: '🔀',
  CARD_DELETED: '🗑️',
  MEMBER_ADDED: '👤',
  LABEL_CREATED: '🏷️',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function ActivityFeed() {
  const activities = useBoardStore((s) => s.activities);

  return (
    <div data-cy="activities-feed" className="p-4 flex flex-col h-full">
      {activities.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhuma atividade ainda.</p>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {activities.map((activity: Activity) => (
            <div key={activity.id} className="flex gap-2 text-xs">
              <span className="text-base leading-none flex-shrink-0">
                {activityIcon[activity.type] ?? '📌'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-slate-700 font-medium truncate">
                  {activityLabel[activity.type] ?? activity.type}
                </p>
                <p className="text-slate-400">{timeAgo(activity.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
