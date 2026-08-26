'use client';

import { useBoardStore } from '../../stores/board-store';
import { CardPriority } from '../../types';
import { SprintSelector } from '../sprint/SprintSelector';
import { TagSelector } from '../tags/TagSelector';

interface BoardFiltersProps {
  boardId: string;
}

const priorityOptions: { value: string; label: string }[] = [
  { value: '', label: 'Todas prioridades' },
  { value: CardPriority.LOW, label: 'Baixa' },
  { value: CardPriority.MEDIUM, label: 'Média' },
  { value: CardPriority.HIGH, label: 'Alta' },
  { value: CardPriority.URGENT, label: 'Urgente' },
];

export function BoardFilters({ boardId }: BoardFiltersProps) {
  const { filters, setFilters } = useBoardStore();

  const hasFilters = Boolean(filters.q || filters.priority || filters.labelId || filters.sprintId);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <SprintSelector boardId={boardId} />
      <TagSelector boardId={boardId} />

      <input
        type="text"
        data-cy="search-cards"
        value={filters.q ?? ''}
        onChange={(e) => setFilters({ q: e.target.value || undefined })}
        placeholder="Buscar cards..."
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white w-44"
      />

      <select
        value={filters.priority ?? ''}
        onChange={(e) => setFilters({ priority: e.target.value || undefined })}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-violet-400 bg-white"
      >
        {priorityOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          data-cy="clear-filters"
          onClick={() => setFilters({
            q: undefined,
            priority: undefined,
            labelId: undefined,
            sprintId: undefined,
          })}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          Limpar filtros ×
        </button>
      )}
    </div>
  );
}
