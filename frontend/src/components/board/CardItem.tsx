'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardPriority, Label } from '../../types';
import { Badge } from '../ui';

interface CardItemProps {
  card: Card;
  boardId: string;
  onClick: () => void;
}

const priorityVariant: Record<CardPriority, 'gray' | 'blue' | 'orange' | 'red'> = {
  [CardPriority.LOW]: 'gray',
  [CardPriority.MEDIUM]: 'blue',
  [CardPriority.HIGH]: 'orange',
  [CardPriority.URGENT]: 'red',
};

const priorityLabel: Record<CardPriority, string> = {
  [CardPriority.LOW]: 'Baixa',
  [CardPriority.MEDIUM]: 'Média',
  [CardPriority.HIGH]: 'Alta',
  [CardPriority.URGENT]: 'Urgente',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatHours(value: number | undefined) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function CardItem({ card, onClick }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'Card', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const estimated = card.estimatedHours ?? 0;
  const executed = card.executedHours ?? 0;
  const progress = estimated > 0 ? Math.min(100, (executed / estimated) * 100) : 0;
  const overBudget = estimated > 0 && executed > estimated;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      data-cy="card-item"
      className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-violet-300 transition-all group"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-slate-300 text-xs cursor-grab active:cursor-grabbing select-none">⠿⠿</span>
        <div className="flex items-center gap-1.5">
          {card.activeTimer && (
            <span
              className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
              title="Timer ativo"
            />
          )}
          <Badge variant={priorityVariant[card.priority]} size="sm">
            {priorityLabel[card.priority]}
          </Badge>
        </div>
      </div>

      <p data-cy="card-title" className="text-sm font-medium text-slate-900 leading-snug mb-2">{card.title}</p>

      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {(card.labels as Label[]).map((label) => (
            <span
              key={label.id}
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {(estimated > 0 || executed > 0) && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span data-cy="card-hours">⏱️ {formatHours(executed)}h / {formatHours(estimated)}h</span>
            {card.sprint?.name && (
              <span className="truncate max-w-[7rem] text-violet-600">{card.sprint.name}</span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : 'bg-violet-500'}`}
              style={{ width: `${estimated > 0 ? progress : executed > 0 ? 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {card.dueDate && (
        <div className="text-xs text-slate-400 mt-1">
          📅 {formatDate(card.dueDate)}
        </div>
      )}
    </div>
  );
}
