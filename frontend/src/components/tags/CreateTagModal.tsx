'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { Label } from '../../types';
import { apiClient } from '../../lib/api-client';
import { useBoardStore } from '../../stores/board-store';
import toast from 'react-hot-toast';

interface CreateTagModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (label: Label) => void;
}

const PALETTE = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

export function CreateTagModal({
  boardId,
  isOpen,
  onClose,
  onCreated,
}: CreateTagModalProps) {
  const addLabel = useBoardStore((s) => s.addLabel);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[5]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.post(`/boards/${boardId}/labels`, {
        name: name.trim(),
        color,
      });
      const label = (res as { data: Label }).data;
      addLabel(label);
      onCreated?.(label);
      toast.success('Tag criada');
      setName('');
      setColor(PALETTE[5]);
      onClose();
    } catch {
      toast.error('Erro ao criar tag');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Tag" size="sm">
      <div className="flex flex-col gap-4">
        <Input
          data-cy="tag-name"
          label="Nome da tag"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: bug, feature"
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Cor</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColor(hex)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  color === hex ? 'border-slate-900 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={hex}
              />
            ))}
          </div>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 p-1 w-20"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} size="sm">Cancelar</Button>
          <Button data-cy="tag-submit" onClick={handleSubmit} isLoading={saving} disabled={!name.trim()} size="sm">
            Criar tag
          </Button>
        </div>
      </div>
    </Modal>
  );
}
