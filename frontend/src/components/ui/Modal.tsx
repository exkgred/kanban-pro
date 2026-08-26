'use client';
import { useEffect, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizeClass} max-h-[90vh] overflow-y-auto`}>
        {title ? (
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
            data-cy="modal-close"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
          </div>
        ) : (
          <button
            data-cy="modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
