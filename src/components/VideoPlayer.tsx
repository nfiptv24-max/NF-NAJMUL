
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
  ShieldCheck
} from 'lucide-react';
import { ServerLink, PlayerStatus, ZoomMode } from '../types';

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(streamUrl);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('contain');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [securityActive, setSecurityActive] = useState(false);

  useEffect(() => {
    setCurrentUrl(streamUrl);
    setUseIframe(false);
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
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, () => {
        setUseIframe(true);
      });
    } else {
      video.src = currentUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => setUseIframe(true));
    }

    return () => cleanupPlayer();
  }, [currentUrl, useIframe]);

  // 🛡️ সিকিউরিটি থার্ড পার্টি মোড চালু সহ Stream Player (com.genuine.leone) ওপেন
  const openInSecureStreamPlayer = () => {
    setSecurityActive(true);

    // Intent Flags: Launch outside app context, keep current task active, secure stream intent
    const intentFlags = 'FLAG_ACTIVITY_NEW_TASK|FLAG_ACTIVITY_CLEAR_TOP|FLAG_ACTIVITY_MULTIPLE_TASK';
    
    // Android Intent with Security Metadata
    const intentUrl = `intent:${currentUrl}#Intent;` +
      `action=android.intent.action.VIEW;` +
      `type=video/*;` +
      `package=com.genuine.leone;` +
      `component=com.genuine.leone/.ui.splash.SplashActivity;` +
      `S.title=${encodeURIComponent(title)};` +
      `B.secure_mode=true;` +
      `launchFlags=0x10000000;` +
      `end;`;

    // Trigger Stream Player
    window.location.href = intentUrl;
  };

  const openInVLC = () => {
    setSecurityActive(true);
    window.location.href = `vlc://${currentUrl}`;
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

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.5];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
  };

  const cycleZoomMode = () => {
    const modes: ZoomMode[] = ['contain', 'cover', 'fill'];
    setZoomMode(modes[(modes.indexOf(zoomMode) + 1) % modes.length]);
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
      {/* সিকিউরিটি স্ট্যাটাস ইন্ডিকেটর (থার্ডপার্টি প্লেয়ার একটিভ থাকলে) */}
      {securityActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-emerald-400 flex items-center gap-1.5 animate-pulse">
          <ShieldCheck className="w-3.5 h-3.5" /> Security Guard Active (External Stream)
        </div>
      )}

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
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none">
        
        {/* টপ বার */}
        <div className="flex items-center justify-between gap-2 pointer-events-auto mt-4 sm:mt-0">
          <button
            onClick={onClose}
            className="bg-black/60 hover:bg-white/20 p-2 rounded-full text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* সার্ভার সিলেক্টর */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[35%] no-scrollbar">
            {servers && servers.map((srv, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentUrl(srv.url);
                  setSecurityActive(false);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap transition ${
                  srv.url === currentUrl ? 'bg-blue-600 text-white' : 'bg-black/60 text-slate-300 hover:bg-black/80'
                }`}
              >
                <Server className="w-3 h-3" />
                {srv.name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {/* 🛡️ Secure Stream Player (com.genuine.leone) Button */}
            <button
              onClick={openInSecureStreamPlayer}
              className="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg border border-purple-400/50 transition active:scale-95"
              title="Open with Security Guard in Stream Player"
            >
              <PlayCircle className="w-3.5 h-3.5" /> Secure Stream
            </button>

            {/* VLC Button */}
            <button
              onClick={openInVLC}
              className="bg-orange-600 hover:bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow transition active:scale-95"
              title="Open in VLC"
            >
              <ExternalLink className="w-3.5 h-3.5" /> VLC
            </button>

            {/* WEB/HLS Switcher */}
            <button
              onClick={() => {
                setUseIframe(!useIframe);
                setSecurityActive(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow transition active:scale-95"
            >
              <RefreshCw className="w-3 h-3" /> {useIframe ? 'WEB' : 'HLS'}
            </button>
          </div>
        </div>

        {/* বটম কন্ট্রোল বার */}
        {!useIframe && (
          <div className="flex flex-col gap-2 bg-black/70 backdrop-blur-md p-3 rounded-xl pointer-events-auto">
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

            {/* প্লে ব্যাক নেভিগেশন ও চ্যানেল চেঞ্জার */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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

              {/* চ্যানেল নেক্সট / প্রিভিয়াস বাটন */}
              <div className="flex items-center gap-3">
                {onPrevChannel && (
                  <button
                    onClick={() => {
                      setSecurityActive(false);
                      onPrevChannel();
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-95"
                    title="Previous Channel"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={togglePlayPause}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition shadow-lg active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>

                {onNextChannel && (
                  <button
                    onClick={() => {
                      setSecurityActive(false);
                      onNextChannel();
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-95"
                    title="Next Channel"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                )}
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
