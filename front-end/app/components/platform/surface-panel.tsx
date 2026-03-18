import React from 'react';
import { cn } from '../ui/utils';

type SurfacePanelProps = React.HTMLAttributes<HTMLDivElement>;

export function SurfacePanel({ className, ...props }: SurfacePanelProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[color:var(--ayel-border)] bg-white/90 shadow-[var(--ayel-shadow-soft)] backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}
