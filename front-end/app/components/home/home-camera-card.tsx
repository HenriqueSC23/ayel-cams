import React from 'react';
import { Lock, MapPin, Play, Unlock } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../figma/image-with-fallback';
import type { CameraRecord } from '../../data/platform';
import { motionTransitions } from '../../lib/motion-presets';

interface HomeCameraCardProps {
  camera: CameraRecord;
  onWatch?: (camera: CameraRecord) => void;
}

export function HomeCameraCard({ camera, onWatch }: HomeCameraCardProps) {
  const statusTone = camera.status === 'live' ? 'border-white/15 bg-[#2e3541cc] text-white' : 'border-white/15 bg-[#3f4959cc] text-white';
  const statusDot = camera.status === 'live' ? 'bg-[#ff4b4b]' : 'bg-[#a6b6cb]';

  const accessTone =
    camera.access === 'restricted'
      ? 'border-[#8d6410] bg-[#463005d6] text-[#ffd66a]'
      : 'border-white/20 bg-[#4f596acc] text-white';

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={motionTransitions.gentleSpring}
      className="group overflow-hidden rounded-[24px] border border-[#d8e2ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_18px_rgba(15,23,42,0.07)] transition-shadow hover:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_16px_28px_rgba(15,23,42,0.11)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-200">
        <ImageWithFallback src={camera.image} alt={camera.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-bold uppercase tracking-[0.04em] ${statusTone}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
            {camera.status === 'live' ? 'AO VIVO' : 'OFFLINE'}
          </span>
          <span className="inline-flex items-center rounded-[12px] border border-white/20 bg-[#5b6678cc] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.04em] text-white">
            {camera.quality}
          </span>
        </div>

        <div className="absolute right-4 top-4">
          <span className={`inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-bold tracking-[0.02em] ${accessTone}`}>
            {camera.access === 'restricted' ? <Lock size={14} /> : <Unlock size={14} />}
            {camera.access === 'restricted' ? 'Restrita' : 'Publica'}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 text-[12px] font-semibold tracking-[0.02em] text-white/95">{camera.updatedAt}</div>
      </div>

      <div className="px-5 pb-5 pt-5">
        <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#002a52]">{camera.name}</h3>

        <p className="mt-3 flex min-w-0 items-start gap-2 text-[14px] font-medium leading-6 text-[#6c8198]">
          <MapPin size={14} className="mt-1 shrink-0 text-[#9db0c4]" />
          <span className="line-clamp-2">{camera.location}</span>
        </p>

        <motion.button
          type="button"
          onClick={() => onWatch?.(camera)}
          disabled={camera.status === 'offline'}
          whileTap={{ scale: 0.98 }}
          transition={motionTransitions.pressSpring}
          className="group/assistir relative mt-4 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-[#d7e0ea] bg-white px-3 text-[14px] font-semibold text-[#35506f] transition hover:border-[#159dde] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-[#159dde] transition-transform duration-300 ease-out group-hover/assistir:scale-x-100" />
          <Play size={14} className="relative z-10" />
          <span className="relative z-10">Assistir</span>
        </motion.button>
      </div>
    </motion.article>
  );
}
