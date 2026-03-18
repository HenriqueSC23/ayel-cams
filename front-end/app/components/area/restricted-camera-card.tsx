import React from 'react';
import { Lock, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { CameraRecord, ViewMode } from '../../data/platform';
import { motionTransitions } from '../../lib/motion-presets';
import { ImageWithFallback } from '../figma/image-with-fallback';
import { cn } from '../ui/utils';

interface RestrictedCameraCardProps {
  camera: CameraRecord;
  viewMode?: ViewMode;
}

export function RestrictedCameraCard({ camera, viewMode = 'grid' }: RestrictedCameraCardProps) {
  const statusTone = camera.status === 'live' ? 'bg-[#3b3b3dcc] text-white' : 'bg-[#3c434fcc] text-white';
  const statusDot = camera.status === 'live' ? 'bg-[#ff4040]' : 'bg-[#a7b5ca]';

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={motionTransitions.gentleSpring}
      className={cn(
        'overflow-hidden rounded-[22px] border border-[#d8e2ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_10px_rgba(15,23,42,0.06)]',
        viewMode === 'list' && 'md:flex',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-slate-200',
          viewMode === 'grid' ? 'aspect-[406/229]' : 'aspect-[406/229] md:w-[430px] md:aspect-auto md:min-h-[248px]',
        )}
      >
        <ImageWithFallback
          src={camera.image}
          alt={camera.name}
          className={cn('h-full w-full object-cover', camera.status === 'offline' && 'brightness-75 saturate-75')}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-[12px] border border-white/10 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.03em] ${statusTone}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
            {camera.status === 'live' ? 'AO VIVO' : 'OFFLINE'}
          </span>
          <span className="inline-flex items-center rounded-[12px] border border-white/25 bg-[#83838399] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.03em] text-white">
            {camera.quality}
          </span>
        </div>

        <div className="absolute right-4 top-4">
          <span className="inline-flex items-center gap-2 rounded-[12px] border border-[#9b6d0f] bg-[#4b3505cc] px-3 py-2 text-[12px] font-bold text-[#ffd45f]">
            <Lock size={14} />
            Restrita
          </span>
        </div>

        {camera.status === 'offline' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
              Sem sinal
            </span>
          </div>
        ) : null}

        <div className="absolute bottom-4 left-4 text-[12px] font-semibold tracking-[0.02em] text-white">{camera.updatedAt}</div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-5">
        <div className="space-y-2">
          <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#002a52]">{camera.name}</h3>
          <p className="flex items-center gap-2 text-[14px] font-medium text-[#6c8198]">
            <span className="h-2 w-2 rounded-full bg-[#c9d4df]" />
            {camera.location}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[#e8eef4] pt-4">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6d84a0]">{camera.category}</span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={motionTransitions.pressSpring}
            className="group/assistir relative inline-flex h-10 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-[#d7e0ea] bg-white px-4 text-[13px] font-semibold text-[#35506f] transition hover:border-[#159dde] hover:text-white"
            aria-label={`Visualizar stream da camera ${camera.name}`}
          >
            <span className="absolute inset-0 origin-left scale-x-0 bg-[#159dde] transition-transform duration-300 ease-out group-hover/assistir:scale-x-100" />
            <Play size={13} className="relative z-10" />
            <span className="relative z-10">Assistir</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
