'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { Sprint, SprintStatus } from '../../types';
import { apiClient } from '../../lib/api-client';
import { useBoardStore } from '../../stores/board-store';
import toast from 'react-hot-toast';

interface CreateSprintModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (sprint: Sprint) => void;
}

const statusOptions: { value: SprintStatus; label: string }[] = [
  { value: SprintStatus.PLANNED, label: 'Planejada' },
  { value: SprintStatus.ACTIVE, label: 'Ativa' },
  { value: SprintStatus.COMPLETED, label: 'Concluída' },
];

export function CreateSprintModal({
  boardId,
  isOpen,
  onClose,
  onCreated,
}: CreateSprintModalProps) {
  const addSprint = useBoardStore((s) => s.addSprint);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<SprintStatus>(SprintStatus.ACTIVE);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setStartDate('');
    setEndDate('');
    setStatus(SprintStatus.ACTIVE);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.post(`/boards/${boardId}/sprints`, {
        name: name.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        status,
      });
      const sprint = (res as { data: Sprint }).data;
      addSprint(sprint);
      onCreated?.(sprint);
      toast.success('Sprint criada');
      reset();
      onClose();
    } catch {
      toast.error('Erro ao criar sprint');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Sprint" size="md">
      <div className="flex flex-col gap-4">
        <Input
          data-cy="sprint-name"
          label="Nome da Sprint"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Sprint 12"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            data-cy="sprint-start"
            label="Data início"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            data-cy="sprint-end"
            label="Data fim"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Status</label>
          <select
            data-cy="sprint-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SprintStatus)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} size="sm">Cancelar</Button>
          <Button data-cy="sprint-submit" onClick={handleSubmit} isLoading={saving} disabled={!name.trim()} size="sm">
            Criar sprint
          </Button>
        </div>
      </div>
    </Modal>
  );
}
