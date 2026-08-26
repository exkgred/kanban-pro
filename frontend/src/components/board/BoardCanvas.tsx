'use client';

import { useState } from 'react';
import { useBoardStore } from '../../stores/board-store';
import { ColumnItem } from './ColumnItem';
import { AddColumnForm } from './AddColumnForm';
import { BoardDndContext } from '../dnd/BoardDndContext';
import { Column, Card, CardPriority } from '../../types';

interface BoardCanvasProps {
  boardId: string;
}

export function BoardCanvas({ boardId }: BoardCanvasProps) {
  const { columns, cards, filters, setColumns } = useBoardStore();
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Apply filters
  const filteredCards = cards.filter((card: Card) => {
    if (filters.q && !card.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.priority && card.priority !== (filters.priority as CardPriority)) return false;
    if (filters.labelId && !card.labels?.some((l) => l.id === filters.labelId)) return false;
    if (filters.sprintId && card.sprintId !== filters.sprintId) return false;
    return true;
  });

  const getColumnCards = (columnId: string) =>
    filteredCards.filter((c: Card) => c.columnId === columnId);

  return (
    <BoardDndContext boardId={boardId}>
      <div className="flex gap-4 p-4 overflow-x-auto h-full items-start">
        {columns.map((column: Column) => (
          <ColumnItem
            key={column.id}
            column={column}
            cards={getColumnCards(column.id)}
            boardId={boardId}
          />
        ))}

        {isAddingColumn ? (
          <AddColumnForm
            boardId={boardId}
            onAdd={(col) => {
              setColumns([...columns, col]);
              setIsAddingColumn(false);
            }}
            onCancel={() => setIsAddingColumn(false)}
          />
        ) : (
          <button
            onClick={() => setIsAddingColumn(true)}
            className="w-72 flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white/60 hover:bg-white border border-dashed border-slate-300 hover:border-violet-400 rounded-xl text-slate-500 hover:text-violet-700 text-sm font-medium transition-all"
          >
            <span className="text-lg leading-none">+</span>
            Nova Coluna
          </button>
        )}
      </div>
    </BoardDndContext>
  );
}
