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
  Loader2
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
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>({
    type: 'loading',
    text: 'Connecting...',
    subText: 'Initializing video stream'
  });
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(streamUrl);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setUseIframe(false);
  }, [streamUrl]);

  const triggerControlsOverlay = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

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
    if (useIframe) {
      setStatus({ type: 'playing', text: 'Embedded Player Active', subText: title });
      return;
    }

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    cleanupPlayer();
    setStatus({ type: 'loading', text: 'Connecting...', subText: title });

    const isHlsUrl = currentUrl.toLowerCase().includes('.m3u8') || currentUrl.includes('hlsmod');

    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => {
          setIsPlaying(true);
          setStatus({ type: 'playing', text: 'Playing', subText: title });
        }).catch(() => {
          setStatus({ type: 'buffering', text: 'Click Play to start', subText: '' });
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setUseIframe(true);
        }
      });
    } else {
      video.src = currentUrl;
      video.play().then(() => {
        setIsPlaying(true);
        setStatus({ type: 'playing', text: 'Playing', subText: title });
      }).catch(() => {
        setUseIframe(true);
      });
    }

    return () => cleanupPlayer();
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
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="sticky top-0 z-40 bg-black rounded-b-2xl overflow-hidden shadow-2xl">
      <div
        ref={containerRef}
        onClick={triggerControlsOverlay}
        onMouseMove={triggerControlsOverlay}
        className={`relative w-full bg-black select-none overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'aspect-video'
        }`}
      >
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
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            autoPlay
            className="w-full h-full absolute inset-0 z-0 bg-black object-contain"
          />
        )}

        {/* Loading Overlay */}
        {status.type !== 'playing' && !useIframe && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <div className="bg-black/80 p-4 rounded-xl text-center flex flex-col items-center gap-2 border border-white/10">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-white font-bold">{status.text}</span>
            </div>
          </div>
        )}

        {/* Video Controls Layer */}
        <div
          className={`absolute inset-0 z-30 flex flex-col justify-between p-3 bg-gradient-to-b from-black/80 via-transparent to-black/90 transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={onClose} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {servers.map((srv, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentUrl(srv.url)}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    srv.url === currentUrl ? 'bg-blue-600 text-white' : 'bg-black/60 text-slate-300'
                  }`}
                >
                  <Server className="w-3 h-3" />
                  {srv.name || `Server ${idx + 1}`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setUseIframe(!useIframe)}
              className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {useIframe ? 'WEB' : 'HLS'}
            </button>
          </div>

          {/* Bottom Bar Controls (Show Control Bar explicitly) */}
          {!useIframe && (
            <div className="flex flex-col gap-2 bg-black/40 p-2 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white font-mono">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration > 0 ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] text-white font-mono">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={toggleMute} className="p-2 text-white">
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button onClick={togglePlayPause} className="p-2.5 bg-blue-600 rounded-full text-white">
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button onClick={toggleFullscreen} className="p-2 text-white">
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
