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
  Server,
  RefreshCw,
  ExternalLink,
  Tv,
  SkipBack,
  SkipForward,
  PlayCircle,
  AlertTriangle,
  Smartphone
} from 'lucide-react';
import { ServerLink, ZoomMode } from '../types';
import { PlayerSelectionModal } from './PlayerSelectionModal';

type PlayerMode = 'hls' | 'dash' | 'native' | 'iframe' | 'external';

interface VideoPlayerProps {
  streamUrl: string;
  servers: ServerLink[];
  title: string;
  logo: string;
  onClose: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  servers,
  title,
  logo,
  onClose,
  onNextChannel,
  onPrevChannel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('hls');
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(streamUrl);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [showControls, setShowControls] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const toggleControls = () => {
    if (showControls) {
      setShowControls(false);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      resetControlsTimeout();
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setHasError(false);
    
    if (streamUrl.toLowerCase().includes('.mpd')) {
      setPlayerMode('dash');
    } else if (streamUrl.toLowerCase().includes('.m3u8')) {
      setPlayerMode('hls');
    } else if (streamUrl.includes('embed') || streamUrl.includes('iframe') || streamUrl.includes('.html')) {
      setPlayerMode('iframe');
    } else {
      setPlayerMode('native');
    }
  }, [streamUrl]);

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
  };

  useEffect(() => {
    cleanupPlayer();
    setHasError(false);

    if (playerMode === 'iframe' || playerMode === 'external') return;

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    // 🚀 HLS Configuration Update for CORS & Better Streaming Performance
    if (playerMode === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        fetchSetup: (context, init) => {
          init.referrerPolicy = 'no-referrer';
          return new Request(context.url, init);
        },
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });

      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // 🚀 Browser Autoplay Policy Bypass Logic
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              break;
          }
        }
      });
    } else {
      video.src = currentUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
      });
    }

    return () => cleanupPlayer();
  }, [currentUrl, playerMode]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const openInExternalApp = (target: 'mx' | 'vlc' | 'any') => {
    if (!currentUrl) return;

    const rawUrl = currentUrl.replace(/^https?:\/\//, '');
    const isHttps = currentUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(title || 'Live Stream');

    let intentUri = '';

    if (target === 'mx') {
      intentUri = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=com.mxtech.videoplayer.ad;S.title=${encodedTitle};end;`;
    } else if (target === 'vlc') {
      intentUri = `vlc://${currentUrl}`;
    } else {
      intentUri = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;S.title=${encodedTitle};end;`;
    }

    window.location.href = intentUri;
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        if (window.screen?.orientation && 'lock' in window.screen.orientation) {
          await (window.screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch (err) {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);

        if (window.screen?.orientation && 'unlock' in window.screen.orientation) {
          (window.screen.orientation as any).unlock();
        }
      } catch (err) {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && window.screen?.orientation && 'unlock' in window.screen.orientation) {
        try {
          (window.screen.orientation as any).unlock();
        } catch (e) {}
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={() => {
        if (!showControls) setShowControls(true);
        resetControlsTimeout();
      }}
      onTouchStart={() => {
        if (!showControls) setShowControls(true);
        resetControlsTimeout();
      }}
      onClick={toggleControls}
      className={`relative bg-black overflow-hidden select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black flex items-center justify-center' 
          : 'w-full aspect-video rounded-b-xl bg-black'
      }`}
      style={{ backgroundColor: '#000000' }}
    >
      {/* ⚠️ Error Overlay */}
      {hasError && playerMode !== 'iframe' ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-4 text-center overflow-y-auto"
        >
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
          <h3 className="text-white text-sm font-bold mb-1">ভিডিও প্লে হতে সমস্যা হচ্ছে?</h3>
          <p className="text-slate-400 text-xs mb-4 max-w-xs">
            সার্ভার মোড পরিবর্তন করুন অথবা নিচের পছন্দের প্লেয়ার দিয়ে প্লে করুন:
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            <button
              onClick={() => openInExternalApp('mx')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <PlayCircle className="w-4 h-4" /> MX Player
            </button>

            <button
              onClick={() => openInExternalApp('vlc')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <ExternalLink className="w-4 h-4" /> VLC Player
            </button>

            <button
              onClick={() => openInExternalApp('any')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <Smartphone className="w-4 h-4" /> Other Players
            </button>

            <button
              onClick={() => setPlayerMode('iframe')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <RefreshCw className="w-4 h-4" /> Iframe Mode
            </button>
          </div>
        </div>
      ) : null}

      {/* 📺 Video Player or Iframe */}
      {playerMode === 'iframe' ? (
        <iframe
          src={currentUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      ) : (
        <video
          ref={videoRef}
          crossOrigin="anonymous" // CORS বাইপাস করতে
          onError={() => setHasError(true)}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setHasError(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          style={{ objectFit: zoomMode, backgroundColor: '#000000' }}
          className="w-full h-full absolute inset-0 z-0 bg-black cursor-pointer"
          autoPlay
          playsInline
        />
      )}

      {/* 🎛️ Control Overlay */}
      <div
        onClick={(e) => e.stopPropagation()} 
        className={`absolute inset-0 z-20 flex flex-col justify-between p-3 bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          paddingTop: 'calc(12px + env(safe-area-inset-top))',
          paddingLeft: 'calc(12px + env(safe-area-inset-left))',
          paddingRight: 'calc(12px + env(safe-area-inset-right))',
        }}
      >
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={onClose} className="bg-black/60 hover:bg-white/20 p-2 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>

          {/* Server Selector List */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[35%]">
            {servers?.map((srv, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentUrl(srv.url)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                  srv.url === currentUrl ? 'bg-blue-600 text-white' : 'bg-black/60 text-slate-300'
                }`}
              >
                <Server className="w-3 h-3 inline mr-1" />
                {srv.name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <select
              value={playerMode}
              onChange={(e) => setPlayerMode(e.target.value as PlayerMode)}
              className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded-md border border-slate-700 outline-none"
            >
              <option value="hls">HLS</option>
              <option value="native">Direct/MP4</option>
              <option value="iframe">Embed/WEB</option>
            </select>

            {/* 📱 App Button triggers Player Selection Modal */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 shadow transition"
            >
              <Smartphone className="w-3 h-3" /> App
            </button>
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div 
          className="flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2.5 rounded-xl"
          style={{
            marginBottom: 'calc(4px + env(safe-area-inset-bottom))'
          }}
        >
          {duration > 0 && playerMode !== 'iframe' && (
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / duration) * 100}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = (parseFloat(e.target.value) / 100) * duration;
                }
              }}
              className="w-full h-1 bg-white/30 rounded cursor-pointer accent-blue-500"
            />
          )}

          <div className="flex items-center justify-between">
            <button onClick={() => setIsMuted(!isMuted)} className="text-white p-1">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-3">
              {onPrevChannel && (
                <button onClick={onPrevChannel} className="p-1.5 bg-white/10 rounded-full text-white active:scale-95 hover:bg-white/20 transition">
                  <SkipBack className="w-4 h-4" />
                </button>
              )}
              {playerMode !== 'iframe' && (
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) {
                        videoRef.current.pause();
                      } else {
                        videoRef.current.play();
                      }
                    }
                  }}
                  className="p-2 bg-blue-600 rounded-full text-white shadow-lg active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
              )}
              {onNextChannel && (
                <button onClick={onNextChannel} className="p-1.5 bg-white/10 rounded-full text-white active:scale-95 hover:bg-white/20 transition">
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const modes: ZoomMode[] = ['contain', 'cover', 'fill'];
                  setZoomMode(modes[(modes.indexOf(zoomMode) + 1) % modes.length]);
                }}
                className="text-white p-1"
                title="Aspect Ratio"
              >
                <Tv className="w-4 h-4" />
              </button>
              
              <button onClick={toggleFullscreen} className="text-white p-1">
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 Player Selection Popup Modal Integration */}
      <PlayerSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoUrl={currentUrl}
        videoTitle={title}
      />
    </div>
  );
};
