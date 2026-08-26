'use client';

import { useState } from 'react';
import { Sprint, SprintStatus } from '../../types';
import { useBoardStore } from '../../stores/board-store';
import { CreateSprintModal } from './CreateSprintModal';

interface SprintSelectorProps {
  boardId: string;
}

const statusLabel: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: 'Planejada',
  [SprintStatus.ACTIVE]: 'Ativa',
  [SprintStatus.COMPLETED]: 'Concluída',
};

export function SprintSelector({ boardId }: SprintSelectorProps) {
  const { sprints, filters, setFilters } = useBoardStore();
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <select
          data-cy="sprint-filter"
          value={filters.sprintId ?? ''}
          onChange={(e) => setFilters({ sprintId: e.target.value || undefined })}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white max-w-[14rem]"
        >
          <option value="">Todas as Sprints</option>
          {sprints.map((sprint: Sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name} ({statusLabel[sprint.status]})
            </option>
          ))}
        </select>
        <button
          type="button"
          data-cy="sprint-create-open"
          onClick={() => setOpenCreate(true)}
          className="whitespace-nowrap text-xs font-medium text-violet-600 hover:text-violet-800 px-2 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
        >
          + Nova Sprint
        </button>
      </div>
      <CreateSprintModal
        boardId={boardId}
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
      />
    </>
  );
}
