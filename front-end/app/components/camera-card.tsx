import React from 'react';
import { ArrowUpRight, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { CameraRecord, ViewMode } from '../data/platform';
import { AccessBadge } from './platform/access-badge';
import { PillBadge } from './platform/pill-badge';
import { StatusBadge } from './platform/status-badge';
import { ImageWithFallback } from './figma/image-with-fallback';
import { cn } from './ui/utils';

interface CameraCardProps {
  camera: CameraRecord;
  viewMode?: ViewMode;
}

export function CameraCard({ camera, viewMode = 'grid' }: CameraCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={cn(
        'group overflow-hidden rounded-[28px] border border-[color:var(--ayel-border)] bg-white shadow-[var(--ayel-shadow-soft)]',
        viewMode === 'list' && 'md:flex md:min-h-[16rem]',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-slate-100',
          viewMode === 'grid' ? 'aspect-[16/10] w-full' : 'h-full min-h-52 w-full md:w-72',
        )}
      >
        <ImageWithFallback
          src={camera.image}
          alt={camera.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={camera.status} />
          <PillBadge className="border-white/20 bg-white/15 text-white backdrop-blur-md">{camera.quality}</PillBadge>
        </div>

        <div className="absolute right-4 top-4">
          <AccessBadge access={camera.access} />
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{camera.unit}</p>
            <p className="mt-1 text-sm font-medium text-white/90">{camera.updatedAt}</p>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
            aria-label={`Abrir ${camera.name}`}
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 md:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--ayel-ink)] transition-colors group-hover:text-[color:var(--ayel-cyan-deep)]">
                {camera.name}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {camera.location} · {camera.category}
              </p>
            </div>
            <ArrowUpRight className="hidden h-5 w-5 text-slate-300 transition-colors group-hover:text-[color:var(--ayel-cyan)] md:block" />
          </div>

          <p className="text-[15px] leading-6 text-slate-500">{camera.description}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <PillBadge tone="ink">{camera.unit}</PillBadge>
            <PillBadge tone="muted">{camera.category}</PillBadge>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ayel-border)] px-4 py-2 text-sm font-semibold text-[color:var(--ayel-ink)] transition hover:border-[color:var(--ayel-cyan-soft)] hover:text-[color:var(--ayel-cyan-deep)]"
          >
            Visualizar
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
