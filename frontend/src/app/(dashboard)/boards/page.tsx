'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Board } from '../../../types';
import { Button, Spinner } from '../../../components/ui';
import { BoardCard } from '../../../components/board/BoardCard';
import { CreateBoardModal } from '../../../components/board/CreateBoardModal';

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await apiClient.get('/boards');
        setBoards(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching boards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoards();
  }, []);

  const handleBoardCreated = (newBoard: Board) => {
    setBoards((prev) => [newBoard, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seus Boards</h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie seus projetos e fluxos de trabalho Kanban</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Novo Board</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhum board encontrado</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
            Crie seu primeiro quadro Kanban para organizar tarefas, colunas e acompanhar o progresso em tempo real.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Criar meu primeiro board</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleBoardCreated}
      />
    </div>
  );
}
