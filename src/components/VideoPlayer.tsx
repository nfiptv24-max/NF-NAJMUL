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

  const [showControls, setShowControls] = useState(true);

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

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setUseIframe(false);
    setHasError(false);
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

    if (useIframe) return;

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    if (Hls.isSupported() && currentUrl.toLowerCase().includes('.m3u8')) {
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

    return () => cleanupPlayer();
  }, [currentUrl, useIframe]);

  // 🚀 ফিক্সড এক্সটার্নাল অ্যাপ রিডাইরেক্ট লজিক
  const openInExternalApp = (packageName?: string) => {
    if (!currentUrl) return;

    if (packageName === 'com.genuine.leone') {
      // Stream Player (com.genuine.leone) অ্যাপ খোলার জন্য সঠিক অ্যান্ড্রয়েড ইনটেন্ট ইউআরএল
      const cleanUrl = currentUrl.replace(/^https?:\/\//, ''); // http:// বা https:// অংশ বাদ দেওয়া
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
      // VLC প্লেয়ার রিডাইরেক্ট
      window.location.href = `vlc://${currentUrl}`;
    }
  };

  // 📱 মোবাইল অ্যাপের জন্য ফুলস্ক্রিন
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className={`bg-black overflow-hidden select-none transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen m-0 p-0 rounded-none'
          : 'relative w-full aspect-video rounded-b-xl'
      }`}
      style={{
        backgroundColor: '#000000',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : 'auto',
      }}
    >
      {/* স্ট্রিমিং এরর / Blocked ওভারলে */}
      {hasError && !useIframe ? (
        <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
          <h3 className="text-white text-sm font-bold mb-1">Stream Loading Failed</h3>
          <p className="text-slate-400 text-xs mb-4 max-w-xs">
            ভিডিওটি অ্যাপের ভেতরে লোড হতে পারছে না। এক্সটার্নাল প্লেয়ার ব্যবহার করুন।
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => openInExternalApp('com.genuine.leone')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <PlayCircle className="w-4 h-4" /> Stream Player
            </button>
            <button
              onClick={() => openInExternalApp()}
              className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 transition"
            >
              <ExternalLink className="w-4 h-4" /> VLC
            </button>
          </div>
        </div>
      ) : null}

      {/* ভিডিও প্লেয়ার */}
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
          className="w-full h-full absolute inset-0 z-0 bg-black object-contain"
          autoPlay
          playsInline
        />
      )}

      {/* অটো-হাইড কন্ট্রোল বার ওভারলে */}
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

          {/* সার্ভার লিস্ট */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[45%]">
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

              {/* চ্যানেল নেভিগেশন */}
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
