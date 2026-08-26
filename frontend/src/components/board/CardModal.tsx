'use client';

import { useEffect, useState } from 'react';
import { Modal, Input, Button, Badge } from '../ui';
import { Card, CardPriority, Label, SprintStatus } from '../../types';
import { apiClient } from '../../lib/api-client';
import { useBoardStore } from '../../stores/board-store';
import { TimeTrackingTab } from './TimeTrackingTab';
import toast from 'react-hot-toast';

interface CardModalProps {
  card: Card;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const priorityOptions: { value: CardPriority; label: string }[] = [
  { value: CardPriority.LOW, label: 'Baixa' },
  { value: CardPriority.MEDIUM, label: 'Média' },
  { value: CardPriority.HIGH, label: 'Alta' },
  { value: CardPriority.URGENT, label: 'Urgente' },
];

const sprintStatusLabel: Record<string, string> = {
  [SprintStatus.PLANNED]: 'Planejada',
  [SprintStatus.ACTIVE]: 'Ativa',
  [SprintStatus.COMPLETED]: 'Concluída',
};

export function CardModal({ card: initialCard, boardId, isOpen, onClose }: CardModalProps) {
  const { handleCardUpdated, handleCardDeleted, labels: boardLabels, sprints, cards, columns } =
    useBoardStore();
  const card = cards.find((c) => c.id === initialCard.id) ?? initialCard;
  const columnTitle = columns.find((c) => c.id === card.columnId)?.title;

  const [tab, setTab] = useState<'details' | 'time'>('details');
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [priority, setPriority] = useState<CardPriority>(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [sprintId, setSprintId] = useState(card.sprintId ?? '');
  const [estimatedHours, setEstimatedHours] = useState(String(card.estimatedHours ?? 0));
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    card.labels?.map((l) => l.id) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? '');
    setPriority(card.priority);
    setDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
    setSprintId(card.sprintId ?? '');
    setEstimatedHours(String(card.estimatedHours ?? 0));
    setSelectedLabelIds(card.labels?.map((l) => l.id) ?? []);
  }, [initialCard.id, isOpen]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.patch(`/boards/${boardId}/cards/${card.id}`, {
        title: title.trim(),
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        sprintId: sprintId || null,
        estimatedHours: Number(estimatedHours) || 0,
        labelIds: selectedLabelIds,
      });
      handleCardUpdated((res as { data: Card }).data);
      toast.success('Card atualizado');
      onClose();
    } catch {
      toast.error('Erro ao salvar card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este card?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/boards/${boardId}/cards/${card.id}`);
      handleCardDeleted({ cardId: card.id });
      toast.success('Card excluído');
      onClose();
    } catch {
      toast.error('Erro ao excluir card');
    } finally {
      setDeleting(false);
    }
  };

  const currentSprint = sprints.find((s) => s.id === (sprintId || card.sprintId));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div data-cy="card-modal" className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 data-cy="card-modal-heading" className="text-lg font-semibold text-slate-900 leading-snug">{card.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {columnTitle ?? 'Coluna'}
              {currentSprint ? ` · ${currentSprint.name}` : ''}
            </p>
          </div>
          {currentSprint && (
            <Badge variant="violet" size="sm">
              {currentSprint.name} · {sprintStatusLabel[currentSprint.status] ?? currentSprint.status}
            </Badge>
          )}
        </div>

        <div className="flex border-b border-slate-200">
          <button
            type="button"
            data-cy="tab-details"
            onClick={() => setTab('details')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'details'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Detalhes
          </button>
          <button
            type="button"
            data-cy="tab-time"
            onClick={() => setTab('time')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'time'
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Apontamento de Horas
          </button>
        </div>

        {tab === 'details' ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Descrição</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Descrição do card..."
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Sprint</label>
                <select
                  data-cy="card-sprint"
                  value={sprintId}
                  onChange={(e) => setSprintId(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">Sem sprint</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CardPriority)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  {priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Data de entrega</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <Input
                data-cy="card-estimated-hours"
                label="Horas planejadas"
                type="number"
                min={0}
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Tags</label>
              {boardLabels.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma tag no quadro. Use “+ Nova Tag” no filtro.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {boardLabels.map((label: Label) => {
                    const selected = selectedLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        data-cy={`card-tag-${label.name}`}
                        onClick={() => toggleLabel(label.id)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white transition ${
                          selected ? 'ring-2 ring-offset-1 ring-slate-900' : 'opacity-50'
                        }`}
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Button variant="danger" onClick={handleDelete} isLoading={deleting} size="sm">
                Excluir card
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose} size="sm">Cancelar</Button>
                <Button data-cy="card-save" onClick={handleSave} isLoading={saving} size="sm">Salvar</Button>
              </div>
            </div>
          </div>
        ) : (
          <TimeTrackingTab card={card} boardId={boardId} />
        )}
      </div>
    </Modal>
  );
}
