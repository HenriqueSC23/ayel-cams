import React from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import type { CameraRecord } from '../../data/platform';
import { motionTransitions, motionVariants } from '../../lib/motion-presets';

interface CameraWatchDialogProps {
  camera: CameraRecord | null;
  onClose: () => void;
}

export function CameraWatchDialog({ camera, onClose }: CameraWatchDialogProps) {
  const streamUrl = camera?.streamUrl?.trim() ?? '';
  const canPlayStream = Boolean(camera && camera.status === 'live' && streamUrl);

  return (
    <Dialog open={Boolean(camera)} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-[920px] overflow-hidden rounded-[24px] border border-[#d8e2ec] bg-white p-0 shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
        <div className="border-b border-[#e8eef5] p-6">
          <DialogTitle className="text-[26px] font-semibold tracking-[-0.03em] text-[#002a52]">{camera?.name || 'Transmissao'}</DialogTitle>
          <DialogDescription className="mt-1 text-[15px] font-medium text-[#58708e]">{camera?.location || ''}</DialogDescription>
        </div>

        <motion.div className="space-y-3 p-6" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
          {canPlayStream ? (
            <div className="overflow-hidden rounded-[16px] border border-[#d8e2ec] bg-black">
              <video className="aspect-video w-full" src={streamUrl} poster={camera?.image} controls autoPlay muted playsInline />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-[16px] border border-[#d8e2ec] bg-slate-100 px-6 text-center text-sm font-medium text-[#5f7289]">
              {camera?.status === 'offline' ? 'Camera offline no momento.' : 'Camera sem URL de stream configurada.'}
            </div>
          )}
          <p className="text-xs text-[#7f95ac]">Transmissao ao vivo da camera selecionada.</p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
