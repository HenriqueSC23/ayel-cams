import React from 'react';
import { cn } from '../ui/utils';

const toneClasses = {
  brand: 'border-[color:var(--ayel-cyan-soft)] bg-[color:var(--ayel-cyan-soft)]/70 text-[color:var(--ayel-cyan-deep)]',
  live: 'border-red-200 bg-red-50 text-red-600',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  muted: 'border-slate-200 bg-slate-50 text-slate-600',
  ink: 'border-[color:var(--ayel-ink)]/10 bg-[color:var(--ayel-ink)]/5 text-[color:var(--ayel-ink)]',
} as const;

interface PillBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof toneClasses;
  icon?: React.ReactNode;
}

export function PillBadge({ tone = 'muted', icon, className, children, ...props }: PillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
