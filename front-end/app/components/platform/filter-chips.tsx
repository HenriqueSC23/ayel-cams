import React from 'react';
import { motion } from 'motion/react';
import { motionTransitions } from '../../lib/motion-presets';
import { cn } from '../ui/utils';

interface FilterChipsProps {
  filters: readonly string[];
  activeFilter: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'brand' | 'ink';
}

export function FilterChips({ filters, activeFilter, onChange, className, variant = 'brand' }: FilterChipsProps) {
  const activeClasses =
    variant === 'ink'
      ? 'border-transparent text-white shadow-[0_6px_10px_rgba(0,36,65,0.16)]'
      : 'border-transparent text-white shadow-[0_6px_10px_rgba(0,159,227,0.2)]';

  const activeBackground =
    variant === 'ink'
      ? 'absolute inset-0 bg-[linear-gradient(135deg,#002441,#07345c)]'
      : 'absolute inset-0 bg-[linear-gradient(135deg,var(--ayel-cyan),var(--ayel-cyan-deep))]';

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => {
        const isActive = filter === activeFilter;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={cn(
              'relative overflow-hidden rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
              isActive ? activeClasses : 'border-[color:var(--ayel-border)] bg-white text-slate-600 hover:border-[color:var(--ayel-cyan-soft)] hover:text-[color:var(--ayel-ink)]',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="filter-chip"
                className={activeBackground}
                transition={motionTransitions.gentleSpring}
              />
            )}
            <motion.span whileTap={{ scale: 0.96 }} transition={motionTransitions.pressSpring} className="relative z-10 inline-flex">
              {filter}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
