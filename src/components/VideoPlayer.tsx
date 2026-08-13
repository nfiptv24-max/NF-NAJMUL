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
  const [useIframe, setUseIframe] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(streamUrl);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 👁️ কন্ট্রোল বার অটো-হাইড স্টেট
  const [showControls, setShowControls] = useState(true);

  // ৩ সেকেন্ড পর অটো হাইড করার লজিক
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

  // 📱/🖱️ স্ক্রিনে টাচ বা ক্লিক করলে কন্ট্রোল বার টগল (Show/Hide) হবে
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

  // HTTPS পেইজে HTTP লিঙ্ক ব্লক চেক
  const checkMixedContent = (url: string) => {
    return window.location.protocol === 'https:' && url.startsWith('http://');
  };

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setUseIframe(false);
    setHasError(checkMixedContent(streamUrl));
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

    if (useIframe) return;

    if (checkMixedContent(currentUrl)) {
      setHasError(true);
      return;
    }

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    if (Hls.isSupported() && currentUrl.toLowerCase().includes('.m3u8')) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn("Autoplay blocked, attempting muted play:", err);
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setHasError(true);
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
  }, [currentUrl, useIframe]);

  // Mute / Unmute Syncing
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 🚀 যেকোনো এক্সটার্নাল অ্যাপ (MX Player, VLC, All Players) দিয়ে প্লে করার লজিক
  const openInExternalApp = (appType: 'mx' | 'vlc' | 'any') => {
    const encodedTitle = encodeURIComponent(title);

    if (appType === 'mx') {
      // নির্দিষ্ট MX Player
      window.location.href = `intent:${currentUrl}#Intent;action=android.intent.action.VIEW;type=video/*;package=com.mxtech.videoplayer.ad;S.title=${encodedTitle};end;`;
    } else if (appType === 'vlc') {
      // নির্দিষ্ট VLC Player
      window.location.href = `vlc://${currentUrl}`;
    } else {
      // 📱 যেকোনো External Player (System App Chooser)
      window.location.href = `intent:${currentUrl}#Intent;action=android.intent.action.VIEW;type=video/*;S.title=${encodedTitle};end;`;
    }
  };

  // Fullscreen Handler
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);

      if (window.screen?.orientation && 'lock' in window.screen.orientation) {
        try {
          await (window.screen.orientation as any).lock('landscape');
        } catch (e) {
          console.warn('Orientation lock failed:', e);
        }
      }
    } else {
      if (window.screen?.orientation && 'unlock' in window.screen.orientation) {
        try {
          window.screen.orientation.unlock();
        } catch (e) {}
      }

      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (window.screen?.orientation && 'unlock' in window.screen.orientation) {
          try {
            window.screen.orientation.unlock();
          } catch (e) {}
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={() => {
        if (!showControls) setShowControls(true);
        resetControlsTimeout();
      }}
      onClick={toggleControls}
      className={`relative bg-black overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'w-full aspect-video rounded-b-xl'
      }`}
    >
      {/* ⚠️ স্ট্রিমিং এরর / External Player অপশন ওভারলে */}
      {hasError && !useIframe ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center overflow-y-auto"
        >
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
          <h3 className="text-white text-sm font-bold mb-1">ভিডিও প্লে হতে সমস্যা হচ্ছে?</h3>
          <p className="text-slate-400 text-xs mb-4 max-w-xs">
            নিচের যেকোনো প্লেয়ার সিলেক্ট করে ভিডিওটি দেখুন:
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            {/* MX Player Button */}
            <button
              onClick={() => openInExternalApp('mx')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <PlayCircle className="w-4 h-4" /> MX Player
            </button>

            {/* VLC Player Button */}
            <button
              onClick={() => openInExternalApp('vlc')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <ExternalLink className="w-4 h-4" /> VLC Player
            </button>

            {/* Other / Any Apps Option */}
            <button
              onClick={() => openInExternalApp('any')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <Smartphone className="w-4 h-4" /> Other Players
            </button>

            {/* Web Iframe Mode */}
            <button
              onClick={() => setUseIframe(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <RefreshCw className="w-4 h-4" /> Web Iframe
            </button>
          </div>
        </div>
      ) : null}

      {/* ভিডিও বা আইফ্রেম প্লেয়ার */}
      {useIframe ? (
        <iframe
          src={currentUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      ) : (
        <video
          ref={videoRef}
          onError={() => setHasError(true)}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          style={{ objectFit: zoomMode }}
          className="w-full h-full absolute inset-0 z-0 bg-black cursor-pointer"
          autoPlay
          playsInline
        />
      )}

      {/* 🎛️ কন্ট্রোল বার ওভারলে */}
      <div
        onClick={(e) => e.stopPropagation()} 
        className={`absolute inset-0 z-20 flex flex-col justify-between p-3 bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* টপ বার */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={onClose} className="bg-black/60 hover:bg-white/20 p-2 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>

          {/* সার্ভার লিস্ট */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[40%]">
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
            {/* টপ বারে সরাসরি External Player এ খেলার বাটন */}
            <button
              onClick={() => openInExternalApp('any')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1"
              title="Open in External App"
            >
              <Smartphone className="w-3 h-3" /> App
            </button>

            <button
              onClick={() => setUseIframe(!useIframe)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-md text-[11px] font-bold"
            >
              {useIframe ? 'HLS' : 'WEB'}
            </button>
          </div>
        </div>

        {/* বটম কন্ট্রোল বার */}
        {!useIframe && (
          <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2.5 rounded-xl">
            {/* সিক বার */}
            <input
              type="range"
              min="0"
              max="100"
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              onChange={(e) => {
                if (videoRef.current && duration > 0) {
                  videoRef.current.currentTime = (parseFloat(e.target.value) / 100) * duration;
                }
              }}
              className="w-full h-1 bg-white/30 rounded cursor-pointer accent-blue-500"
            />

            <div className="flex items-center justify-between">
              <button onClick={() => setIsMuted(!isMuted)} className="text-white p-1">
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* চ্যানেল নেভিগেশন (Next / Previous) */}
              <div className="flex items-center gap-3">
                {onPrevChannel && (
                  <button onClick={onPrevChannel} className="p-1.5 bg-white/10 rounded-full text-white active:scale-95">
                    <SkipBack className="w-4 h-4" />
                  </button>
                )}
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
                {onNextChannel && (
                  <button onClick={onNextChannel} className="p-1.5 bg-white/10 rounded-full text-white active:scale-95">
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
                >
                  <Tv className="w-4 h-4" />
                </button>
                <button onClick={toggleFullscreen} className="text-white p-1">
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
