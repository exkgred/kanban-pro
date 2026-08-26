import Link from 'next/link';
import { Badge } from '../ui';

interface BoardCardProps {
  board: {
    id: string;
    title: string;
    description?: string;
    visibility: 'PRIVATE' | 'WORKSPACE';
  };
}

export function BoardCard({ board }: BoardCardProps) {
  return (
    <Link href={`/boards/${board.id}`} className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-slate-900 truncate pr-2">{board.title}</h3>
        <Badge variant={board.visibility === 'PRIVATE' ? 'gray' : 'violet'}>
          {board.visibility === 'PRIVATE' ? 'Private' : 'Workspace'}
        </Badge>
      </div>
      <p className="text-sm text-slate-500 truncate">{board.description || 'Sem descrição'}</p>
    </Link>
  );
}
