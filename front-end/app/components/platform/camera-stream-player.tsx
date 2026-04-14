import React from 'react';
import type Hls from 'hls.js';
import { ImageWithFallback } from '../figma/image-with-fallback';
import { cn } from '../ui/utils';
import type { StreamPlaybackType } from '../../services/camera-service';

export type CameraStreamPlayerMode = 'preview' | 'modal';
export type CameraStreamPlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CameraStreamPlayerProps {
  title: string;
  playbackType?: StreamPlaybackType | null;
  playbackUrl?: string;
  posterUrl?: string;
  fallbackImage?: string;
  mode: CameraStreamPlayerMode;
  className?: string;
  posterClassName?: string;
  mediaClassName?: string;
  onStatusChange?: (status: CameraStreamPlayerStatus) => void;
}

function noop() {}

export function CameraStreamPlayer({
  title,
  playbackType,
  playbackUrl,
  posterUrl,
  fallbackImage,
  mode,
  className,
  posterClassName,
  mediaClassName,
  onStatusChange = noop,
}: CameraStreamPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const [status, setStatus] = React.useState<CameraStreamPlayerStatus>('idle');

  const surfaceImage = posterUrl || fallbackImage || '';
  const canRenderMedia = Boolean(playbackType && playbackUrl);
  const canRenderIframe = playbackType === 'iframe' && mode === 'modal';
  const canRenderHls = playbackType === 'hls' && Boolean(playbackUrl);
  const canRenderImage = playbackType === 'image' && Boolean(playbackUrl);
  const mediaVisible = status === 'ready';

  React.useEffect(() => {
    onStatusChange(status);
  }, [onStatusChange, status]);

  React.useEffect(() => {
    if (!canRenderMedia) {
      setStatus('idle');
      return;
    }

    if (playbackType === 'iframe' && mode !== 'modal') {
      setStatus('error');
      return;
    }

    setStatus('loading');
  }, [canRenderMedia, mode, playbackType, playbackUrl]);

  React.useEffect(() => {
    const video = videoRef.current;
    const streamUrl = playbackUrl?.trim() || '';

    if (!video || !canRenderHls || !streamUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      return;
    }

    let cancelled = false;
    let hls: Hls | null = null;

    const markReady = () => {
      if (!cancelled) {
        setStatus('ready');
      }
    };

    const markError = () => {
      if (!cancelled) {
        setStatus('error');
      }
    };

    const attemptAutoplay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => undefined);
      }
    };

    const handleVideoReady = () => {
      markReady();
      attemptAutoplay();
    };

    const handleVideoError = () => {
      markError();
    };

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.muted = true;

    video.addEventListener('loadeddata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);
    video.addEventListener('playing', handleVideoReady);
    video.addEventListener('error', handleVideoError);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.load();
      attemptAutoplay();
    } else {
      void import('hls.js')
        .then(({ default: HlsModule }) => {
          if (cancelled) {
            return;
          }

          if (!HlsModule.isSupported()) {
            markError();
            return;
          }

          hls = new HlsModule({
            enableWorker: true,
            lowLatencyMode: true,
          });

          hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
            attemptAutoplay();
          });

          hls.on(HlsModule.Events.ERROR, (_, data) => {
            if (data.fatal) {
              markError();
            }
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hlsRef.current = hls;
        })
        .catch(() => {
          markError();
        });
    }

    return () => {
      cancelled = true;
      video.removeEventListener('loadeddata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      video.removeEventListener('playing', handleVideoReady);
      video.removeEventListener('error', handleVideoError);
      video.pause();
      video.removeAttribute('src');
      video.load();

      if (hls) {
        hls.destroy();
      }

      if (hlsRef.current === hls) {
        hlsRef.current = null;
      }
    };
  }, [canRenderHls, mode, playbackUrl]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {surfaceImage ? (
        <ImageWithFallback
          src={surfaceImage}
          alt=""
          aria-hidden
          className={cn('absolute inset-0 h-full w-full object-cover', posterClassName)}
        />
      ) : null}

      {canRenderHls ? (
        <video
          ref={videoRef}
          poster={surfaceImage || undefined}
          controls={mode === 'modal'}
          disablePictureInPicture={mode === 'preview'}
          controlsList={mode === 'preview' ? 'nodownload noplaybackrate nofullscreen' : 'nodownload noplaybackrate'}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
            mediaVisible ? 'opacity-100' : 'opacity-0',
            mediaClassName,
          )}
          aria-label={title}
        />
      ) : null}

      {canRenderImage ? (
        <img
          src={playbackUrl}
          alt={title}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
            mediaVisible ? 'opacity-100' : 'opacity-0',
            mediaClassName,
          )}
          loading="eager"
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      ) : null}

      {canRenderIframe ? (
        <iframe
          src={playbackUrl}
          title={title}
          className={cn(
            'absolute inset-0 h-full w-full border-0 transition-opacity duration-300',
            mediaVisible ? 'opacity-100' : 'opacity-0',
            mediaClassName,
          )}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          scrolling="no"
          onLoad={() => setStatus('ready')}
        />
      ) : null}
    </div>
  );
}
