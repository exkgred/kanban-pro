import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple' | 'violet';
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
