'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../stores/auth-store';

const PUBLIC_PATHS = new Set(['/login', '/register']);

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  if (!isPublic && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Carregando...
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-right" />
      <AuthInitializer>{children}</AuthInitializer>
    </>
  );
}
