'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Button } from '../ui';
import { apiClient } from '../../lib/api-client';
import toast from 'react-hot-toast';

import { Board } from '../../types';

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'WORKSPACE']),
});

type FormData = z.infer<typeof schema>;

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (board: Board) => void;
}

export function CreateBoardModal({ isOpen, onClose, onCreated }: CreateBoardModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: 'PRIVATE' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await apiClient.post('/boards', data);
      onCreated(response.data);
      reset();
      onClose();
      toast.success('Board criado com sucesso');
    } catch {
      toast.error('Erro ao criar board');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Board">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Título" {...register('title')} error={errors.title?.message} placeholder="Nome do board" />
        <Input label="Descrição" {...register('description')} error={errors.description?.message} placeholder="Opcional" />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Visibilidade</label>
          <select {...register('visibility')} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="PRIVATE">Privado</option>
            <option value="WORKSPACE">Workspace</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isSubmitting}>Criar Board</Button>
        </div>
      </form>
    </Modal>
  );
}
