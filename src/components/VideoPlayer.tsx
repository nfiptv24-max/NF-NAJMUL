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
  Tv
} from 'lucide-react';
import { ServerLink, PlayerStatus, ZoomMode } from '../types';

interface VideoPlayerProps {
  streamUrl: string;
  servers: ServerLink[];
  title: string;
  logo: string;
  onClose: () => void;
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
  const [status, setStatus] = useState<PlayerStatus>({ type: 'loading', text: 'Connecting...' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(streamUrl);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // লিংক পরিবর্তন হলে প্লেয়ার রিসেট
  useEffect(() => {
    setCurrentUrl(streamUrl);
    setUseIframe(false);
  }, [streamUrl]);

  // প্লেয়ার ক্লিনআপ
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

  // প্লেয়ার ইঞ্জিন (HLS or Iframe)
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
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, () => {
        setUseIframe(true); // HLS ফেল করলে অটোমেটিক Iframe-এ সুইচ করবে
      });
    } else {
      video.src = currentUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => setUseIframe(true));
    }

    return () => cleanupPlayer();
  }, [currentUrl, useIframe]);

  // প্লে / পজ টগল
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // মিউট টগল
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // স্পিড পরিবর্তন
  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.5];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
  };

  // জুম মোড পরিবর্তন (Aspect Ratio)
  const cycleZoomMode = () => {
    const modes: ZoomMode[] = ['contain', 'cover', 'fill'];
    setZoomMode(modes[(modes.indexOf(zoomMode) + 1) % modes.length]);
  };

  // ফুলস্ক্রিন টগল
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

  // VLC প্লেয়ারে স্ট্রিমিং ওপেন করার অপশন
  const openInVLC = () => {
    const vlcIntentUrl = `vlc://${currentUrl}`;
    window.location.href = vlcIntentUrl;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'w-full aspect-video rounded-b-xl'
      }`}
    >
      {/* ভিডিও এলিমেন্ট অথবা আইফ্রেম */}
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
          onTimeUpdate={handleTimeUpdate}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ objectFit: zoomMode }}
          className="w-full h-full absolute inset-0 z-0 bg-black"
          autoPlay
          playsInline
        />
      )}

      {/* কন্ট্রোল ওভারলে */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-4 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none">
        
        {/* টপ বার (বন্ধ বাটন, সার্ভিস সুইচ, VLC বাটন, WEB/HLS বাটন) */}
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <button
            onClick={onClose}
            className="bg-black/60 hover:bg-white/20 p-2 rounded-full text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* সার্ভার সিলেক্টর */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%] no-scrollbar">
            {servers && servers.map((srv, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentUrl(srv.url)}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap transition ${
                  srv.url === currentUrl ? 'bg-blue-600 text-white' : 'bg-black/60 text-slate-300 hover:bg-black/80'
                }`}
              >
                <Server className="w-3 h-3" />
                {srv.name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* VLC Player এ ওপেন করার অপশন */}
            <button
              onClick={openInVLC}
              className="bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow transition"
              title="Open stream in VLC App"
            >
              <ExternalLink className="w-3 h-3" /> VLC
            </button>

            {/* WEB (Iframe) / HLS টগল বাটন */}
            <button
              onClick={() => setUseIframe(!useIframe)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow transition"
            >
              <RefreshCw className="w-3 h-3" /> {useIframe ? 'WEB' : 'HLS'}
            </button>
          </div>
        </div>

        {/* বটম কন্ট্রোল বার (শুধু HLS/Video মোডে দেখাবে) */}
        {!useIframe && (
          <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md p-3 rounded-xl pointer-events-auto">
            {/* সিক বার */}
            <div className="flex items-center gap-2">
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
                className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* বাটনসমূহ */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={togglePlayPause} className="text-white hover:text-blue-400 p-1">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-blue-400 p-1">
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={cycleSpeed}
                  className="text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md"
                >
                  {playbackSpeed}x
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={cycleZoomMode} className="text-white hover:text-blue-400 p-1" title="Aspect Ratio">
                  <Tv className="w-5 h-5" />
                </button>
                <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 p-1">
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
