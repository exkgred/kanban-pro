'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Card } from '../../types';
import { apiClient } from '../../lib/api-client';
import { useBoardStore } from '../../stores/board-store';
import { CardItem } from './CardItem';
import { CardModal } from './CardModal';
import { AddCardForm } from './AddCardForm';
import toast from 'react-hot-toast';

interface ColumnItemProps {
  column: Column;
  cards: Card[];
  boardId: string;
}

export function ColumnItem({ column, cards, boardId }: ColumnItemProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const { handleCardCreated, handleColumnUpdated, setColumns, columns } = useBoardStore();

  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: 'Column', column } });

  const handleTitleSave = async () => {
    if (!titleValue.trim() || titleValue === column.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const res = await apiClient.patch(`/boards/${boardId}/columns/${column.id}`, {
        title: titleValue.trim(),
      });
      handleColumnUpdated(res.data as Column);
    } catch {
      toast.error('Erro ao atualizar coluna');
      setTitleValue(column.title);
    }
    setEditingTitle(false);
  };

  const handleDeleteColumn = async () => {
    if (!confirm(`Excluir coluna "${column.title}" e todos os cards?`)) return;
    try {
      await apiClient.delete(`/boards/${boardId}/columns/${column.id}`);
      setColumns(columns.filter((c) => c.id !== column.id));
      toast.success('Coluna excluída');
    } catch {
      toast.error('Erro ao excluir coluna');
    }
  };

  const sortedCards = [...cards].sort((a, b) => a.position - b.position);

  return (
    <>
      <div
        className={`w-72 flex-shrink-0 flex flex-col max-h-full rounded-xl transition-all ${
          isOver
            ? 'bg-violet-100/80 ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-100'
            : 'bg-slate-200/60'
        }`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          {editingTitle ? (
            <input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(column.title); }
              }}
              className="flex-1 font-semibold text-sm text-slate-800 bg-white border border-violet-400 rounded px-2 py-0.5 outline-none"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="flex-1 text-left font-semibold text-sm text-slate-800 hover:text-violet-700 truncate"
            >
              {column.title}
            </button>
          )}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-slate-400 font-medium">{cards.length}</span>
            <button
              onClick={handleDeleteColumn}
              className="text-slate-400 hover:text-red-500 transition-colors text-sm ml-1"
              title="Excluir coluna"
            >
              ×
            </button>
          </div>
        </div>

        {/* Cards list */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-2 min-h-[2rem]"
        >
          <SortableContext items={sortedCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {sortedCards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                boardId={boardId}
                onClick={() => setSelectedCard(card)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Add card */}
        <div className="px-3 pb-3">
          {isAddingCard ? (
            <AddCardForm
              columnId={column.id}
              boardId={boardId}
              onAdd={(card) => { handleCardCreated(card); setIsAddingCard(false); }}
              onCancel={() => setIsAddingCard(false)}
            />
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full text-left text-sm text-slate-500 hover:text-violet-700 hover:bg-white/50 rounded-lg px-2 py-1.5 transition-colors"
            >
              + Adicionar card
            </button>
          )}
        </div>
      </div>

      {/* Card modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          isOpen={true}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
