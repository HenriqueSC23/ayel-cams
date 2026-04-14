import React from 'react';
import type { CameraRecord } from '../../data/platform';
import { createStreamSessionRequest, type StreamSessionResponse } from '../../services/camera-service';
import { CameraStreamPlayer, type CameraStreamPlayerStatus } from './camera-stream-player';

interface CameraLivePreviewProps {
  camera: CameraRecord;
  token?: string | null;
  className?: string;
  imageClassName?: string;
}

export function CameraLivePreview({ camera, token, className, imageClassName }: CameraLivePreviewProps) {
  const [session, setSession] = React.useState<StreamSessionResponse | null>(null);
  const [playerStatus, setPlayerStatus] = React.useState<CameraStreamPlayerStatus>('idle');
  const [isLoading, setIsLoading] = React.useState(false);
  const canPreview = Boolean(camera.status === 'live' && camera.hasStream && (token || camera.access === 'public'));

  React.useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      if (!canPreview) {
        setSession(null);
        setPlayerStatus('idle');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSession(null);
      setPlayerStatus('loading');

      try {
        const response = await createStreamSessionRequest(camera.id, token);
        if (!isMounted) {
          return;
        }

        setSession(response);
      } catch {
        if (!isMounted) {
          return;
        }

        setSession(null);
        setPlayerStatus('error');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      isMounted = false;
    };
  }, [camera.id, canPreview, token]);

  return (
    <div className={className}>
      <CameraStreamPlayer
        title={`Preview ao vivo de ${camera.name}`}
        playbackType={session?.playbackType}
        playbackUrl={session?.playbackUrl}
        posterUrl={session?.posterUrl}
        fallbackImage={camera.image}
        mode="preview"
        className="h-full w-full"
        posterClassName={imageClassName}
        mediaClassName="absolute inset-0 h-full w-full object-cover"
        onStatusChange={setPlayerStatus}
      />

      {canPreview && (isLoading || playerStatus === 'loading') ? (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-start bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.08),rgba(2,6,23,0.55))] p-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/90 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff4b4b]" />
            Conectando
          </span>
        </div>
      ) : null}
    </div>
  );
}
