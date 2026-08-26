'use client';

import { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { Column } from '../../types';
import { useBoardStore } from '../../stores/board-store';

interface AddColumnFormProps {
  boardId: string;
  onAdd: (column: Column) => void;
  onCancel: () => void;
}

export function AddColumnForm({ boardId, onAdd, onCancel }: AddColumnFormProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const columns = useBoardStore((s) => s.columns);
  const nextPosition = columns.length > 0
    ? Math.max(...columns.map((c) => c.position)) + 1000
    : 1000;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/boards/${boardId}/columns`, {
        title: title.trim(),
        position: nextPosition,
      });
      onAdd(res.data as Column);
      setTitle('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-72 flex-shrink-0 bg-slate-200/60 rounded-xl p-3 flex flex-col gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        data-cy="column-title-input"
        placeholder="Título da coluna..."
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          className="px-3 py-1.5 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Adicionar'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-slate-600 text-sm rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
