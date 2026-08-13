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
  AlertTriangle
} from 'lucide-react';
import { ServerLink, ZoomMode } from '../types';

interface VideoPlayerProps {
  streamUrl: string;
  servers?: ServerLink[];
  title?: string;
  logo?: string;
  onClose: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl = '',
  servers = [],
  title = 'Live Stream',
  logo = '',
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
  const [currentUrl, setCurrentUrl] = useState<string>(streamUrl || '');
  const [zoomMode, setZoomMode] = useState<ZoomMode>('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // 👁️ কন্ট্রোল বার অটো-হাইড লজিক
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // Mixed Content / HTTPS চেক (Null Safe)
  const checkMixedContent = (url: string) => {
    if (!url) return false;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const validUrl = streamUrl || '';
    setCurrentUrl(validUrl);
    setUseIframe(false);
    setHasError(checkMixedContent(validUrl));
  }, [streamUrl]);

  const cleanupPlayer = () => {
    try {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    } catch (err) {
      console.error("Cleanup error:", err);
    }
  };

  // 📺 স্ট্রিমিং লোড লজিক (Crash-Safe)
  useEffect(() => {
    cleanupPlayer();

    if (useIframe || !currentUrl) return;

    if (checkMixedContent(currentUrl)) {
      setHasError(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    try {
      const urlLower = currentUrl.toLowerCase();
      if (Hls.isSupported() && urlLower.includes('.m3u8')) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(currentUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
        });

        hls.on(Hls.Events.ERROR, () => {
          setHasError(true);
        });
      } else {
        video.src = currentUrl;
        video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
      }
    } catch (err) {
      console.error("Playback init error:", err);
      setHasError(true);
    }

    return () => cleanupPlayer();
  }, [currentUrl, useIframe]);

  // 🚀 External App Open
  const openInExternalApp = (packageName?: string) => {
    if (!currentUrl) return;

    if (packageName === 'com.genuine.leone') {
      const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
      const isHttps = currentUrl.startsWith('https://');
      const scheme = isHttps ? 'https' : 'http';

      const intentUrl = `intent://${cleanUrl}#Intent;` +
        `action=android.intent.action.VIEW;` +
        `type=video/*;` +
        `package=${packageName};` +
        `S.title=${encodeURIComponent(title)};` +
        `scheme=${scheme};` +
        `end;`;

      window.location.href = intentUrl;
    } else {
      window.location.href = `vlc://${currentUrl}`;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      ref={containerRef}
      onClick={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className={`bg-black overflow-hidden select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-full h-full'
          : 'relative w-full aspect-video rounded-b-xl'
      }`}
    >
      {/* ১. স্ট্রিমিং না থাকলে / ইউআরএল ফাঁকা হলে অ্যালার্ট */}
      {!currentUrl && (
        <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col items-center justify-center p-4 text-center text-white">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mb-2" />
          <p className="text-sm font-semibold">No Video Stream URL Found!</p>
          <button onClick={onClose} className="mt-3 px-4 py-1.5 bg-red-600 rounded-lg text-xs font-bold">
            Close Player
          </button>
        </div>
      )}

      {/* ২. এরর ওভারলে */}
      {hasError && !useIframe && currentUrl ? (
        <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
          <h3 className="text-white text-sm font-bold mb-1">Stream Blocked or Offline</h3>
          <p className="text-slate-400 text-xs mb-4 max-w-xs">
            সরাসরি প্লে হচ্ছে না। নিচের প্লেয়ারগুলোর একটি বেছে নিন।
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => openInExternalApp('com.genuine.leone')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <PlayCircle className="w-4 h-4" /> Stream Player
            </button>
            <button
              onClick={() => openInExternalApp()}
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <ExternalLink className="w-4 h-4" /> VLC
            </button>
            <button
              onClick={() => setUseIframe(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <RefreshCw className="w-4 h-4" /> Web Iframe
            </button>
          </div>
        </div>
      ) : null}

      {/* ৩. ভিডিও প্লেয়ার / আইফ্রেম */}
      {useIframe ? (
        <iframe
          src={currentUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          onError={() => setHasError(true)}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime || 0);
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          style={{ objectFit: zoomMode }}
          className="w-full h-full absolute inset-0 z-0 bg-black object-contain"
          autoPlay
          playsInline
        />
      )}

      {/* ৪. কন্ট্রোল বার */}
      <div
        className={`absolute inset-0 z-10 flex flex-col justify-between p-3 bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* টপ বার */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={onClose} className="bg-black/60 hover:bg-white/20 p-2 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[45%]">
            {Array.isArray(servers) && servers.map((srv, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentUrl(srv.url || '')}
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
            <button
              onClick={() => openInExternalApp('com.genuine.leone')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1"
            >
              <PlayCircle className="w-3 h-3" /> Player
            </button>
            <button
              onClick={() => setUseIframe(!useIframe)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-md text-[11px] font-bold"
            >
              {useIframe ? 'HLS' : 'WEB'}
            </button>
          </div>
        </div>

        {/* বটম বার */}
        {!useIframe && (
          <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-md p-2.5 rounded-xl">
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

              <div className="flex items-center gap-3">
                {onPrevChannel && (
                  <button onClick={onPrevChannel} className="p-1.5 bg-white/10 rounded-full text-white">
                    <SkipBack className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => (isPlaying ? videoRef.current?.pause() : videoRef.current?.play())}
                  className="p-2 bg-blue-600 rounded-full text-white shadow-lg"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                {onNextChannel && (
                  <button onClick={onNextChannel} className="p-1.5 bg-white/10 rounded-full text-white">
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
