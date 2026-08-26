'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useState, ReactNode } from 'react';
import { Card } from '../../types';
import { useBoardStore } from '../../stores/board-store';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';

interface BoardDndContextProps {
  boardId: string;
  children: ReactNode;
}

export function BoardDndContext({ boardId, children }: BoardDndContextProps) {
  const { cards, setCards, moveCardOptimistic, revertCard } = useBoardStore();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function findColumn(id: string): string | null {
    // id can be a column id or a card id
    const card = cards.find((c) => c.id === id);
    if (card) return card.columnId;
    return id; // assume it's a column id
  }

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === 'Card') {
      setActiveCard(data.card as Card);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeData = active.data.current;
    if (activeData?.type !== 'Card') return;

    const activeCard = cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    const overCardData = over.data.current;
    const isOverCard = overCardData?.type === 'Card';
    const isOverColumn = overCardData?.type === 'Column';

    const newColumnId = isOverCard
      ? (overCardData.card as Card).columnId
      : isOverColumn
      ? overId
      : findColumn(overId) ?? activeCard.columnId;

    if (newColumnId !== activeCard.columnId) {
      // Moving to a different column — optimistic column change
      const updatedCards = cards.map((c) =>
        c.id === activeId ? { ...c, columnId: newColumnId, position: 0 } : c
      );
      setCards(updatedCards);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedCard = cards.find((c) => c.id === activeId);
    if (!draggedCard) return;

    const overCardData = over.data.current;
    const isOverCard = overCardData?.type === 'Card';
    const isOverColumn = overCardData?.type === 'Column';

    const newColumnId = isOverCard
      ? (overCardData.card as Card).columnId
      : isOverColumn
      ? overId
      : findColumn(overId) ?? draggedCard.columnId;

    // Compute new position
    const columnCards = cards
      .filter((c) => c.columnId === newColumnId && c.id !== activeId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;
    if (isOverCard) {
      const overCard = overCardData.card as Card;
      const overIdx = columnCards.findIndex((c) => c.id === overCard.id);
      if (overIdx === -1) {
        newPosition = columnCards.length > 0 ? columnCards[columnCards.length - 1].position + 1000 : 1000;
      } else {
        const before = columnCards[overIdx - 1]?.position ?? 0;
        const current = columnCards[overIdx].position;
        newPosition = Math.round((before + current) / 2);
        if (newPosition === before || newPosition === current) {
          newPosition = current - 1;
        }
      }
    } else {
      newPosition = columnCards.length > 0
        ? columnCards[columnCards.length - 1].position + 1000
        : 1000;
    }

    const originalCard = { ...draggedCard };
    moveCardOptimistic(activeId, newColumnId, newPosition);

    try {
      await apiClient.post(`/boards/${boardId}/cards/${activeId}/move`, {
        columnId: newColumnId,
        position: newPosition,
      });
    } catch {
      revertCard(originalCard);
      toast.error('Erro ao mover card — revertido');
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {children}
      <DragOverlay>
        {activeCard && (
          <div className="bg-white rounded-lg p-3 border-2 border-violet-500 shadow-2xl w-64 rotate-2 scale-105">
            <p className="text-sm font-medium text-slate-900">{activeCard.title}</p>
            <p className="text-[11px] text-violet-600 mt-1">Solte na coluna de destino</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
