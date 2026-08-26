'use client';

import { useState } from 'react';
import { Label } from '../../types';
import { useBoardStore } from '../../stores/board-store';
import { CreateTagModal } from './CreateTagModal';

interface TagSelectorProps {
  boardId: string;
}

export function TagSelector({ boardId }: TagSelectorProps) {
  const { labels, filters, setFilters } = useBoardStore();
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <select
          data-cy="tag-filter"
          value={filters.labelId ?? ''}
          onChange={(e) => setFilters({ labelId: e.target.value || undefined })}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white max-w-[12rem]"
        >
          <option value="">Todas as tags</option>
          {labels.map((label: Label) => (
            <option key={label.id} value={label.id}>{label.name}</option>
          ))}
        </select>
        <button
          type="button"
          data-cy="tag-create-open"
          onClick={() => setOpenCreate(true)}
          className="whitespace-nowrap text-xs font-medium text-violet-600 hover:text-violet-800 px-2 py-1.5 rounded-lg hover:bg-violet-50 transition-colors"
        >
          + Nova Tag
        </button>
      </div>
      <CreateTagModal
        boardId={boardId}
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
      />
    </>
  );
}
