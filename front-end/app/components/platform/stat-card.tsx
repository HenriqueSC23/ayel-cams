import React from 'react';
import { cn } from '../ui/utils';
import { SurfacePanel } from './surface-panel';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  note?: string;
  accent?: 'cyan' | 'ink';
  className?: string;
}

export function StatCard({ label, value, icon, note, accent = 'cyan', className }: StatCardProps) {
  return (
    <SurfacePanel className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-semibold tracking-[-0.03em] text-[color:var(--ayel-ink)]">{value}</h3>
          </div>
          {note ? <p className="text-[13px] text-slate-500">{note}</p> : null}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl border',
            accent === 'cyan'
              ? 'border-[color:var(--ayel-cyan-soft)] bg-[color:var(--ayel-cyan-soft)] text-[color:var(--ayel-cyan-deep)]'
              : 'border-[color:var(--ayel-ink)]/10 bg-[color:var(--ayel-ink)]/5 text-[color:var(--ayel-ink)]',
          )}
        >
          {icon}
        </div>
      </div>
    </SurfacePanel>
  );
}
