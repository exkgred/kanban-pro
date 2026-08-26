'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Link from 'next/link';
import { Button } from '@/components/ui';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/boards" className="text-xl font-bold text-violet-600">
                  KanbanPro
                </Link>
              </div>
              <div className="ml-6 flex items-center space-x-4">
                <Link href="/boards" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                  Boards
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-slate-500 mr-4">Olá, {user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
