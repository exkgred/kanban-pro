'use client';

import { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { Card, CardPriority } from '../../types';
import { useBoardStore } from '../../stores/board-store';

interface AddCardFormProps {
  columnId: string;
  boardId: string;
  onAdd: (card: Card) => void;
  onCancel: () => void;
}

export function AddCardForm({ columnId, boardId, onAdd, onCancel }: AddCardFormProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const cards = useBoardStore((s) => s.cards);
  const columnCards = cards.filter((c) => c.columnId === columnId);
  const nextPosition = columnCards.length > 0
    ? Math.max(...columnCards.map((c) => c.position)) + 1000
    : 1000;

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post(`/boards/${boardId}/cards`, {
        title: title.trim(),
        columnId,
        priority: CardPriority.MEDIUM,
        position: nextPosition,
      });
      onAdd(res.data as Card);
      setTitle('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Título do card..."
        rows={2}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
