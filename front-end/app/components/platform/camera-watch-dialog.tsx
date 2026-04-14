import React from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import type { CameraRecord } from '../../data/platform';
import { motionTransitions, motionVariants } from '../../lib/motion-presets';
import { createStreamSessionRequest, type StreamSessionResponse } from '../../services/camera-service';
import { getRequestErrorMessage } from '../../services/request-error';
import { CameraStreamPlayer, type CameraStreamPlayerStatus } from './camera-stream-player';

interface CameraWatchDialogProps {
  camera: CameraRecord | null;
  token?: string | null;
  onClose: () => void;
}

const MIN_PLAYBACK_LOADING_MS = 1600;

export function CameraWatchDialog({ camera, token, onClose }: CameraWatchDialogProps) {
  const [session, setSession] = React.useState<StreamSessionResponse | null>(null);
  const [playerStatus, setPlayerStatus] = React.useState<CameraStreamPlayerStatus>('idle');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMediaLoading, setIsMediaLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const canPlayStream = Boolean(camera && camera.status === 'live' && camera.hasStream);
  const mediaLoadingTimerRef = React.useRef<number | null>(null);
  const mediaLoadingStartedAtRef = React.useRef<number | null>(null);

  const clearMediaLoadingTimer = React.useCallback(() => {
    if (mediaLoadingTimerRef.current !== null) {
      window.clearTimeout(mediaLoadingTimerRef.current);
      mediaLoadingTimerRef.current = null;
    }
  }, []);

  const resetMediaLoading = React.useCallback(() => {
    clearMediaLoadingTimer();
    mediaLoadingStartedAtRef.current = null;
    setIsMediaLoading(false);
  }, [clearMediaLoadingTimer]);

  const startMediaLoading = React.useCallback(() => {
    clearMediaLoadingTimer();
    mediaLoadingStartedAtRef.current = Date.now();
    setIsMediaLoading(true);
  }, [clearMediaLoadingTimer]);

  const finishMediaLoading = React.useCallback(() => {
    const startedAt = mediaLoadingStartedAtRef.current;
    if (!startedAt) {
      setIsMediaLoading(false);
      return;
    }

    const elapsedMs = Date.now() - startedAt;
    const remainingMs = Math.max(0, MIN_PLAYBACK_LOADING_MS - elapsedMs);

    clearMediaLoadingTimer();

    if (remainingMs === 0) {
      mediaLoadingStartedAtRef.current = null;
      setIsMediaLoading(false);
      return;
    }

    mediaLoadingTimerRef.current = window.setTimeout(() => {
      mediaLoadingStartedAtRef.current = null;
      mediaLoadingTimerRef.current = null;
      setIsMediaLoading(false);
    }, remainingMs);
  }, [clearMediaLoadingTimer]);

  React.useEffect(() => {
    return () => {
      clearMediaLoadingTimer();
    };
  }, [clearMediaLoadingTimer]);

  const handlePlayerStatusChange = React.useCallback(
    (nextStatus: CameraStreamPlayerStatus) => {
      setPlayerStatus((currentStatus) => {
        if (currentStatus === nextStatus) {
          return currentStatus;
        }

        if (nextStatus === 'loading') {
          startMediaLoading();
        } else if (nextStatus === 'ready') {
          finishMediaLoading();
        } else {
          resetMediaLoading();
        }

        return nextStatus;
      });
    },
    [finishMediaLoading, resetMediaLoading, startMediaLoading],
  );

  React.useEffect(() => {
    let isMounted = true;

    async function createSession() {
      if (!camera || !canPlayStream) {
        setSession(null);
        setPlayerStatus('idle');
        setErrorMessage('');
        setIsLoading(false);
        resetMediaLoading();
        return;
      }

      if (!token && camera.access !== 'public') {
        setSession(null);
        setPlayerStatus('error');
        setErrorMessage('Faca login para iniciar a transmissao com seguranca.');
        setIsLoading(false);
        resetMediaLoading();
        return;
      }

      setIsLoading(true);
      setErrorMessage('');
      setSession(null);
      setPlayerStatus('idle');
      resetMediaLoading();

      try {
        const response = await createStreamSessionRequest(camera.id, token);
        if (isMounted) {
          setSession(response);
        }
      } catch (error) {
        if (isMounted) {
          setSession(null);
          setPlayerStatus('error');
          setErrorMessage(getRequestErrorMessage(error, 'Nao foi possivel iniciar a transmissao da camera.'));
          resetMediaLoading();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void createSession();

    return () => {
      isMounted = false;
    };
  }, [camera, canPlayStream, resetMediaLoading, token]);

  const showPlaybackLoadingOverlay = isLoading || isMediaLoading;
  const loadingTitle = isLoading ? 'Preparando transmissao segura...' : 'Conectando camera ao vivo...';
  const loadingDescription = isLoading
    ? 'Estamos validando o acesso e iniciando a sessao do player.'
    : 'A imagem vai aparecer automaticamente assim que o stream responder.';

  return (
    <Dialog open={Boolean(camera)} onOpenChange={(isOpen) => (!isOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-[920px] overflow-hidden rounded-[24px] border border-[#d8e2ec] bg-white p-0 shadow-[0_14px_28px_rgba(15,23,42,0.18)]">
        <div className="border-b border-[#e8eef5] p-6">
          <DialogTitle className="text-[26px] font-semibold tracking-[-0.03em] text-[#002a52]">{camera?.name || 'Transmissao'}</DialogTitle>
          <DialogDescription className="mt-1 text-[15px] font-medium text-[#58708e]">{camera?.location || ''}</DialogDescription>
        </div>

        <motion.div className="space-y-3 p-6" variants={motionVariants.fadeUp} initial="initial" animate="animate" exit="exit" transition={motionTransitions.enter}>
          {isLoading ? (
            <div className="relative aspect-video overflow-hidden rounded-[16px] border border-[#d8e2ec] bg-[#06121f]">
              {camera?.image ? (
                <img src={camera.image} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-md" />
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,22,39,0.88),rgba(4,35,61,0.78),rgba(0,0,0,0.82))]" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
                <div className="space-y-2">
                  <p className="text-base font-semibold text-white">{loadingTitle}</p>
                  <p className="max-w-md text-sm leading-6 text-white/72">{loadingDescription}</p>
                </div>
              </div>
            </div>
          ) : canPlayStream && session ? (
            <div className="relative aspect-video overflow-hidden rounded-[16px] border border-[#d8e2ec] bg-black">
              <CameraStreamPlayer
                title={`Transmissao ao vivo de ${camera?.name || 'camera'}`}
                playbackType={session.playbackType}
                playbackUrl={session.playbackUrl}
                posterUrl={session.posterUrl}
                fallbackImage={camera?.image}
                mode="modal"
                className="h-full w-full"
                posterClassName="absolute inset-0 h-full w-full object-cover"
                mediaClassName="absolute inset-0 h-full w-full object-cover bg-black"
                onStatusChange={handlePlayerStatusChange}
              />
              {showPlaybackLoadingOverlay ? (
                <div className="absolute inset-0 z-10 overflow-hidden">
                  {session.posterUrl || camera?.image ? (
                    <img
                      src={session.posterUrl || camera?.image}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-md"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,22,39,0.88),rgba(4,35,61,0.78),rgba(0,0,0,0.82))]" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-white">{loadingTitle}</p>
                      <p className="max-w-md text-sm leading-6 text-white/72">{loadingDescription}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-[16px] border border-[#d8e2ec] bg-slate-100 px-6 text-center text-sm font-medium text-[#5f7289]">
              {camera?.status === 'offline'
                ? 'Camera offline no momento.'
                : errorMessage || 'Camera sem stream configurado ou sem sessao valida de transmissao.'}
            </div>
          )}
          <p className="text-xs text-[#7f95ac]">Transmissao ao vivo da camera selecionada.</p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
