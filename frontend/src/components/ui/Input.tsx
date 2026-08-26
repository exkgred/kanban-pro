'use client';
import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input
      ref={ref}
      className={`border rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
        error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
      } disabled:opacity-50 ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
));
Input.displayName = 'Input';
