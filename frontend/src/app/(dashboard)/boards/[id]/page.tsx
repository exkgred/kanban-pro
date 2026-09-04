'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBoardStore } from '../../../../stores/board-store';
import { useAuthStore } from '../../../../stores/auth-store';
import { apiClient } from '../../../../lib/api-client';
import { getSocket, disconnectSocket } from '../../../../lib/socket';
import { BoardCanvas } from '../../../../components/board/BoardCanvas';
import { BoardFilters } from '../../../../components/filters/BoardFilters';
import { ActivityFeed } from '../../../../components/activity/ActivityFeed';
import { Spinner } from '../../../../components/ui';
import { Activity } from '../../../../types';
import { isDemo } from '../../../../lib/demo-mode';

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const {
    setBoard, setColumns, setCards, setLabels, setSprints, reset,
    handleCardCreated, handleCardUpdated, handleCardMoved,
    handleCardDeleted, handleColumnUpdated, handleActivityCreated,
    isLoading,
  } = useBoardStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const board = useBoardStore((s) => s.board);
  const activityCount = useBoardStore((s) => s.activities.length);
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const [boardRes, cardsRes, labelsRes, activitiesRes, sprintsRes] = await Promise.all([
          apiClient.get(`/boards/${id}`),
          apiClient.get(`/boards/${id}/cards`),
          apiClient.get(`/boards/${id}/labels`),
          apiClient.get(`/boards/${id}/activities?limit=30`),
          apiClient.get(`/boards/${id}/sprints`),
        ]);
        setBoard(boardRes.data);
        setColumns(boardRes.data.columns ?? []);
        setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
        setLabels(Array.isArray(labelsRes.data) ? labelsRes.data : []);
        setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : []);
        const acts: Activity[] = activitiesRes.data?.items ?? activitiesRes.data ?? [];
        useBoardStore.setState({ activities: Array.isArray(acts) ? acts : [] });
      } catch (err) {
        console.error('Error loading board:', err);
      }
    };

    load();

    if (accessToken && !isDemo) {
      const socket = getSocket(accessToken);
      socket.connect();
      socket.emit('join:board', { boardId: id });
      socket.on('card:created', handleCardCreated);
      socket.on('card:updated', handleCardUpdated);
      socket.on('card:moved', handleCardMoved);
      socket.on('card:deleted', handleCardDeleted);
      socket.on('column:updated', handleColumnUpdated);
      socket.on('activity:created', handleActivityCreated);
    }

    return () => {
      disconnectSocket();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-100">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0 gap-4">
        <h1 className="text-lg font-bold text-slate-900 flex-shrink-0">{board?.title}</h1>
        <button
          type="button"
          data-cy="activities-toggle"
          onClick={() => setActivitiesOpen((open) => !open)}
          aria-expanded={activitiesOpen}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            activitiesOpen
              ? 'border-violet-300 bg-violet-50 text-violet-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700'
          }`}
        >
          <span className={`text-xs transition-transform ${activitiesOpen ? 'rotate-90' : ''}`}>▶</span>
          Atividades
          {activityCount > 0 && (
            <span className="min-w-[1.25rem] rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">
              {activityCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <BoardFilters boardId={id} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <BoardCanvas boardId={id} />
        </div>

        <aside
          data-cy="activities-panel"
          className={`flex-shrink-0 overflow-hidden border-slate-200 bg-white transition-all duration-200 ease-out ${
            activitiesOpen ? 'w-72 border-l' : 'w-0 border-l-0'
          }`}
        >
          <div className="flex h-full w-72 flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-700">Atividades</h3>
              <button
                type="button"
                data-cy="activities-close"
                onClick={() => setActivitiesOpen(false)}
                className="rounded-md px-2 py-0.5 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar atividades"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ActivityFeed />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
