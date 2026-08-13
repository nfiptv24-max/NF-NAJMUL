import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Server,
  PictureInPicture2,
  RefreshCw
} from 'lucide-react';
import { ServerLink, PlayerStatus, ZoomMode } from '../types';
import { DEFAULT_LOGO } from '../data/initialData';

interface VideoPlayerProps {
  streamUrl: string;
  servers: ServerLink[];
  title: string;
  logo: string;
  onClose: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onFailoverNext?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  servers,
  title,
  logo,
  onClose,
  onNextChannel,
  onPrevChannel,
  onFailoverNext
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useIframe, setUseIframe] = useState(false); // 👈 Iframe Toggle State
  const [status, setStatus] = useState<PlayerStatus>({
    type: 'loading',
    text: 'Connecting...',
    subText: 'Initializing video stream'
  });
  const [showChannelInfo, setShowChannelInfo] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(streamUrl);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const hideInfoTimer = useRef<NodeJS.Timeout | null>(null);
  const failoverTimer = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef<number>(0);

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setUseIframe(false); // Reset Iframe mode on URL change
  }, [streamUrl]);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release().catch(() => {});
        }
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (_) {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    setShowChannelInfo(true);
    if (hideInfoTimer.current) clearTimeout(hideInfoTimer.current);
    hideInfoTimer.current = setTimeout(() => {
      setShowChannelInfo(false);
    }, 3500);

    return () => {
      if (hideInfoTimer.current) clearTimeout(hideInfoTimer.current);
    };
  }, [title, logo, currentUrl]);

  const triggerControlsOverlay = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      const now = Date.now();
      if (now - lastInteractionTime.current > 300) {
        lastInteractionTime.current = now;
        triggerControlsOverlay();
      }
    }
  };

  const lockLandscape = () => {
    try {
      const orientation = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orientation && typeof orientation.lock === 'function') {
        orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}
  };

  const unlockOrientation = () => {
    try {
      const orientation = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      }
    } catch (_) {}
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isFS);
      if (!isFS) {
        unlockOrientation();
      } else {
        lockLandscape();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    triggerControlsOverlay();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  const cleanupPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    releaseWakeLock();
  };

  // Main Stream Loader Logic
  useEffect(() => {
    if (useIframe) {
      setStatus({ type: 'playing', text: 'Playing via Embedded Player', subText: title });
      return;
    }

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    cleanupPlayer();
    setStatus({ type: 'loading', text: 'Connecting...', subText: title || 'Loading stream' });

    const isHlsUrl =
      currentUrl.toLowerCase().includes('.m3u8') ||
      currentUrl.includes('hlsmod') ||
      currentUrl.includes('tiktokcdn');

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 3,
      });

      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setIsPlaying(true);
          setStatus({ type: 'playing', text: 'Playing', subText: title });
          requestWakeLock();
        }).catch(() => {
          setStatus({ type: 'buffering', text: 'Click Play to start', subText: 'Autoplay prevented' });
        });
      });

      // If Hls fails due to CORS, switch automatically to Iframe fallback
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.warn('HLS Error encountered. Switching to Iframe Fallback...');
          setUseIframe(true);
        }
      });
    } else {
      video.src = currentUrl;
      video.play().then(() => {
        setIsPlaying(true);
        setStatus({ type: 'playing', text: 'Playing', subText: title });
        requestWakeLock();
      }).catch(() => {
        console.warn('Direct play failed. Switching to Iframe Fallback...');
        setUseIframe(true);
      });
    }

    return () => {
      cleanupPlayer();
      if (failoverTimer.current) clearTimeout(failoverTimer.current);
    };
  }, [currentUrl, useIframe]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (value / 100) * duration;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const isFS = !!document.fullscreenElement;

    if (!isFS) {
      try {
        await containerRef.current.requestFullscreen();
        lockLandscape();
      } catch (_) {
        lockLandscape();
      }
    } else {
      try {
        await document.exitFullscreen();
        unlockOrientation();
      } catch (_) {
        unlockOrientation();
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`sticky top-0 z-40 bg-black rounded-b-2xl overflow-hidden shadow-2xl border-b border-white/10 ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''}`}>
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className={`relative w-full bg-black group select-none overflow-hidden transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none flex items-center justify-center' : 'aspect-video'
        }`}
      >
        {/* Render either HTML5 Video or Iframe Player */}
        {useIframe ? (
          <iframe
            src={currentUrl}
            className="w-full h-full absolute inset-0 z-0 bg-black border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setStatus({ type: 'buffering', text: 'Buffering...', subText: 'Loading buffer' })}
            onPlaying={() => {
              setIsPlaying(true);
              setStatus({ type: 'playing', text: 'Playing', subText: title });
            }}
            onPause={() => setIsPlaying(false)}
            playsInline
            autoPlay
            style={{ objectFit: zoomMode }}
            className="w-full h-full absolute inset-0 z-0 bg-black"
          />
        )}

        {/* ACTIVE CHANNEL LOGO OVERLAY */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none transition-all duration-500 flex flex-col items-center gap-2 ${
            showChannelInfo ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/60 p-3 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center">
            <img
              src={logo || DEFAULT_LOGO}
              alt={title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_LOGO;
              }}
              className="max-w-full max-h-full object-contain rounded-full"
            />
          </div>
          <div className="bg-black/80 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold text-white max-w-[80vw] truncate shadow-lg">
            {title}
          </div>
        </div>

        {/* STATUS OVERLAY */}
        {status.type !== 'playing' && !useIframe && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="bg-black/90 backdrop-blur-md border border-white/15 px-5 py-3 rounded-2xl text-center shadow-2xl flex flex-col items-center gap-1.5 min-w-[200px]">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-xs font-bold text-white">{status.text}</span>
              {status.subText && <span className="text-[10px] text-slate-400">{status.subText}</span>}
            </div>
          </div>
        )}

        {/* CONTROLS OVERLAY */}
        <div
          className={`absolute inset-0 z-30 flex flex-col justify-between bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Bar */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shadow-md"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {servers.map((srv, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentUrl(srv.url)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${
                    srv.url === currentUrl
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-black/70 text-slate-200 border border-white/20'
                  }`}
                >
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  {srv.name || `Server ${idx + 1}`}
                </button>
              ))}
            </div>

            {/* Manual Switch Button to toggle Iframe Mode */}
            <button
              onClick={() => setUseIframe(!useIframe)}
              className="bg-emerald-600/60 text-emerald-200 border border-emerald-400/50 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1"
              title="Switch Player Engine"
            >
              <RefreshCw className="w-3 h-3" />
              {useIframe ? 'WEB' : 'HLS'}
            </button>
          </div>

          {/* Bottom Controls Bar (Only when not using Iframe) */}
          {!useIframe && (
            <div className="p-3.5 sm:p-5 flex flex-col gap-3 bg-gradient-to-t from-black/95 via-black/85 to-transparent">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-slate-200 min-w-[42px] text-center">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration > 0 ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className="flex-1 h-2 sm:h-2.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs font-mono font-semibold text-slate-200 min-w-[42px] text-center">
                  {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-1">
                <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center">
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <div className="flex items-center gap-2.5">
                  <button onClick={togglePlayPause} className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl">
                    {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
                  </button>
                </div>

                <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center">
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
