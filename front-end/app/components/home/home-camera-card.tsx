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
  const statusTone = camera.status === 'live' ? 'bg-[#3b3b3dcc] text-white' : 'bg-[#3c434fcc] text-white';
  const statusDot = camera.status === 'live' ? 'bg-[#ff4040]' : 'bg-[#a7b5ca]';

  const accessTone =
    camera.access === 'restricted'
      ? 'border-[#9b6d0f] bg-[#4b3505cc] text-[#ffd45f]'
      : 'border-white/25 bg-[#8d8d8d66] text-white';

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={motionTransitions.gentleSpring}
      className="group overflow-hidden rounded-[22px] border border-[#d8e2ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_10px_rgba(15,23,42,0.06)]"
    >
      <div className="relative aspect-[406/229] overflow-hidden bg-slate-200">
        <ImageWithFallback src={camera.image} alt={camera.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
          <span className={`inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-bold ${accessTone}`}>
            {camera.access === 'restricted' ? <Lock size={14} /> : <Unlock size={14} />}
            {camera.access === 'restricted' ? 'Restrita' : 'Pública'}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 text-[12px] font-semibold tracking-[0.02em] text-white">
          13/03/2026 • 17:18:39
        </div>
      </div>

      <div className="px-5 pb-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#002a52]">{camera.name}</h3>
        </div>

        <p className="mt-2 flex min-w-0 items-start gap-2 text-[14px] font-medium text-[#6c8198]">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#9db0c4]" />
            <span>{camera.location}</span>
        </p>

        <motion.button
          type="button"
          onClick={() => onWatch?.(camera)}
          disabled={camera.status === 'offline'}
          whileTap={{ scale: 0.98 }}
          transition={motionTransitions.pressSpring}
          className="group/assistir relative mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 overflow-hidden rounded-full border border-[#d7e0ea] bg-white px-3 text-[13px] font-semibold text-[#35506f] transition hover:border-[#159dde] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="absolute inset-0 origin-left scale-x-0 bg-[#159dde] transition-transform duration-300 ease-out group-hover/assistir:scale-x-100" />
          <Play size={13} className="relative z-10" />
          <span className="relative z-10">Assistir</span>
        </motion.button>
      </div>
    </motion.article>
  );
}
