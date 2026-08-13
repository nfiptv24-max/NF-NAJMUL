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
  PictureInPicture2
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

  // Synchronize currentUrl when streamUrl prop changes
  useEffect(() => {
    setCurrentUrl(streamUrl);
  }, [streamUrl]);

  // Request screen WakeLock to prevent screen dimming
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

  // Reset channel info overlay on new channel / stream load
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

  // Controls auto-hide timer
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

  // Lock or unlock orientation
  const lockLandscape = () => {
    try {
      const orientation = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orientation && typeof orientation.lock === 'function') {
        orientation.lock('landscape').catch(() => {});
      } else if ((screen as any).lockOrientation) {
        (screen as any).lockOrientation('landscape');
      }
    } catch (_) {}
  };

  const unlockOrientation = () => {
    try {
      const orientation = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation) as any;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      } else if ((screen as any).unlockOrientation) {
        (screen as any).unlockOrientation();
      }
    } catch (_) {}
  };

  // Fullscreen change listener
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
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    triggerControlsOverlay();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  // Trigger control timer on play state change
  useEffect(() => {
    triggerControlsOverlay();
  }, [isPlaying]);

  // TV Remote (D-Pad) and Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const key = e.key;
      triggerControlsOverlay();

      switch (key) {
        case 'Enter':
        case ' ':
        case 'Select':
        case 'MediaPlayPause':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (onPrevChannel) {
            onPrevChannel();
          } else if (videoRef.current && duration > 0 && isFinite(duration)) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (onNextChannel) {
            onNextChannel();
          } else if (videoRef.current && duration > 0 && isFinite(duration)) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
        case 'ArrowUp':
        case 'ChannelUp':
        case 'PageUp':
          e.preventDefault();
          if (onNextChannel) onNextChannel();
          break;
        case 'ArrowDown':
        case 'ChannelDown':
        case 'PageDown':
          e.preventDefault();
          if (onPrevChannel) onPrevChannel();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
        case 'Backspace':
        case 'GoBack':
          if (onClose) {
            e.preventDefault();
            onClose();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, duration, onNextChannel, onPrevChannel, onClose]);

  // Video cleanup
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

  // Main Stream Loader with Custom HLS & CORS Handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentUrl) return;

    cleanupPlayer();
    setStatus({ type: 'loading', text: 'Connecting...', subText: title || 'Loading stream' });

    // Enhanced URL detection for HLS Streams
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
        xhrSetup: (xhr) => {
          xhr.withCredentials = false; // Bypass strict CORS restriction
        },
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 5,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 5,
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

      // Smart Error Handling & Auto-recovery
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Network error, attempting to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Media error, attempting to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.warn('Fatal HLS Error, triggering failover:', data);
              setStatus({ type: 'error', text: 'Stream Error', subText: 'Auto-switching channel...' });
              if (failoverTimer.current) clearTimeout(failoverTimer.current);
              failoverTimer.current = setTimeout(() => {
                if (onFailoverNext) onFailoverNext();
              }, 2000);
              break;
          }
        }
      });
    } else {
      // Direct MP4 or native browser playback
      video.src = currentUrl;
      video.play().then(() => {
        setIsPlaying(true);
        setStatus({ type: 'playing', text: 'Playing', subText: title });
        requestWakeLock();
      }).catch((err) => {
        console.warn('Video element play error:', err);
        setStatus({ type: 'error', text: 'Playback Failed', subText: 'Trying alternative server...' });
        if (failoverTimer.current) clearTimeout(failoverTimer.current);
        failoverTimer.current = setTimeout(() => {
          if (onFailoverNext) onFailoverNext();
        }, 2500);
      });
    }

    return () => {
      cleanupPlayer();
      if (failoverTimer.current) clearTimeout(failoverTimer.current);
    };
  }, [currentUrl]);

  // Video event listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleWaiting = () => {
    setStatus({ type: 'buffering', text: 'Buffering...', subText: 'Loading stream buffer' });
  };

  const handleCanPlay = () => {
    setStatus({ type: 'playing', text: 'Playing', subText: title });
  };

  const handlePlaying = () => {
    setIsPlaying(true);
    setStatus({ type: 'playing', text: 'Playing', subText: title });
    requestWakeLock();
  };

  const handlePause = () => {
    setIsPlaying(false);
    releaseWakeLock();
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

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const cycleZoomMode = () => {
    const modes: ZoomMode[] = ['contain', 'cover', 'fill'];
    const nextIdx = (modes.indexOf(zoomMode) + 1) % modes.length;
    setZoomMode(modes[nextIdx]);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    const isFS = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFS) {
      try {
        const elem = containerRef.current as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        lockLandscape();
      } catch (_) {
        lockLandscape();
      }
    } else {
      try {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        unlockOrientation();
      } catch (_) {
        unlockOrientation();
      }
    }
  };

  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (_) {}
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
        {/* HTML5 Video Element with No-Referrer Policy for Third-Party / TikTok Streams */}
        <video
          ref={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onPause={handlePause}
          playsInline
          autoPlay
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          style={{ objectFit: zoomMode }}
          className="w-full h-full absolute inset-0 z-0 bg-black"
        />

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
        {status.type !== 'playing' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="bg-black/90 backdrop-blur-md border border-white/15 px-5 py-3 rounded-2xl text-center shadow-2xl flex flex-col items-center gap-1.5 min-w-[200px]">
              {status.type === 'loading' || status.type === 'buffering' ? (
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              ) : status.type === 'error' ? (
                <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              )}
              <span className="text-xs font-bold text-white">{status.text}</span>
              {status.subText && <span className="text-[10px] text-slate-400">{status.subText}</span>}
            </div>
          </div>
        )}

        {/* TAP TO SHOW CONTROLS LAYER */}
        {!showControls && (
          <div
            className="absolute inset-0 z-30 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              triggerControlsOverlay();
            }}
          />
        )}

        {/* CONTROLS OVERLAY */}
        <div
          className={`absolute inset-0 z-30 flex flex-col justify-between bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              setShowControls(false);
              if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
            }
          }}
        >
          {/* Top Bar: Close Button + Server Selector Pills */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
              title="Close Player"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Server Links Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {servers.map((srv, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentUrl(srv.url)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap active:scale-95 ${
                    srv.url === currentUrl
                      ? 'bg-blue-600 text-white border border-blue-400 shadow-lg shadow-blue-500/40'
                      : 'bg-black/70 text-slate-200 border border-white/20 hover:bg-white/25'
                  }`}
                >
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  {srv.name || `Server ${idx + 1}`}
                </button>
              ))}
            </div>

            <div className="bg-blue-600/40 text-blue-300 border border-blue-400/50 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase">
              HLS
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="p-3.5 sm:p-5 flex flex-col gap-3 bg-gradient-to-t from-black/95 via-black/85 to-transparent">
            {/* Seek Bar */}
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

            {/* Buttons Row */}
            <div className="flex items-center justify-between gap-2.5 pt-1">
              {/* Left group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={cycleSpeed}
                  className="px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-extrabold transition-all shadow-md"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
              </div>

              {/* Center Playback Controls */}
              <div className="flex items-center gap-2.5">
                {onPrevChannel && (
                  <button
                    onClick={onPrevChannel}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                    title="Previous Channel"
                  >
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
                <button
                  onClick={togglePlayPause}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 transition-all transform active:scale-95"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" /> : <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-0.5" />}
                </button>
                {onNextChannel && (
                  <button
                    onClick={onNextChannel}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                    title="Next Channel"
                  >
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={cycleZoomMode}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                  title={`Zoom Mode: ${zoomMode.toUpperCase()}`}
                >
                  <Tv className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePiP}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                  title="Picture in Picture"
                >
                  <PictureInPicture2 className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all shadow-md"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
