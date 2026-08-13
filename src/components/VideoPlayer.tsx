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
  Smartphone,
  Layers
} from 'lucide-react';
import { ServerLink, ZoomMode } from '../types';

// সাপোর্ট করা সকল প্লেয়ার মোড
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

  // Mixed Content Check
  const checkMixedContent = (url: string) => {
    return window.location.protocol === 'https:' && url.startsWith('http://');
  };

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setHasError(checkMixedContent(streamUrl));
    
    // অটোমেটিক বেস্ট মোড ডিটেকশন
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

  // 🎬 বিভিন্ন প্লেয়ার মোড লোড করার লজিক
  useEffect(() => {
    cleanupPlayer();
    setHasError(false);

    if (playerMode === 'iframe' || playerMode === 'external') return;

    if (checkMixedContent(currentUrl)) {
      setHasError(true);
      return;
    }

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    // ১. HLS Stream Mode
    if (playerMode === 'hls' && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setHasError(true);
      });
    } 
    // ২. MP4, Direct Link, FLV বা Native Engine Mode
    else {
      video.src = currentUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
      });
    }

    return () => cleanupPlayer();
  }, [currentUrl, playerMode]);

  // Mute / Unmute Syncing
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 🚀 Android Intent দিয়ে বিশ্বমানের সকল এক্সটার্নাল অ্যাপ অপশন হ্যান্ডেল করা
  const openInExternalApp = (target: 'mx' | 'vlc' | 'any') => {
    const titleParam = encodeURIComponent(title);
    
    if (target === 'mx') {
      window.location.href = `intent:${currentUrl}#Intent;action=android.intent.action.VIEW;type=video/*;package=com.mxtech.videoplayer.ad;S.title=${titleParam};end;`;
    } else if (target === 'vlc') {
      window.location.href = `vlc://${currentUrl}`;
    } else {
      // 📱 যেকোনো External Player (System App Chooser Popup)
      const genericIntent = `intent:${currentUrl}#Intent;action=android.intent.action.VIEW;type=video/*;S.title=${titleParam};end;`;
      window.location.href = genericIntent;
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
      {hasError && playerMode !== 'iframe' ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center overflow-y-auto"
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

      {/* 📺 বিভিন্ন প্লেয়ার মোড অনুযায়ী ভিডিও বা আইফ্রেম রেন্ডার */}
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

      {/* 🎛️ সার্বজনীন কন্ট্রোল বার ওভারলে (সকল মোডেই দৃশ্যমান থাকবে) */}
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

          {/* মোড সিলেকশন ও External App বাটন */}
          <div className="flex items-center gap-1">
            {/* প্লেয়ার মোড সিলেক্টর (HLS, DASH, WEB, IFRAME) */}
            <select
              value={playerMode}
              onChange={(e) => setPlayerMode(e.target.value as PlayerMode)}
              className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded-md border border-slate-700 outline-none"
            >
              <option value="hls">HLS</option>
              <option value="native">Direct/MP4</option>
              <option value="iframe">Embed/WEB</option>
            </select>

            <button
              onClick={() => openInExternalApp('any')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1"
              title="Open in App"
            >
              <Smartphone className="w-3 h-3" /> App
            </button>
          </div>
        </div>

        {/* বটম কন্ট্রোল বার (সকল মোড এবং HLS মোডেই কাজ করবে) */}
        <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2.5 rounded-xl">
          {/* সিক বার (যদি ডুরেশন থাকে) */}
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

            {/* চ্যানেল নেভিগেশন (Next / Previous Channel) - সকল মোডেই অন থাকবে */}
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
              >
                <Tv className="w-4 h-4" />
              </button>
              <button onClick={toggleFullscreen} className="text-white p-1">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
