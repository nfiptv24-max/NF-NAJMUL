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
  Loader2,
  Download,
  Share2,
  Settings
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
  const retryCountRef = useRef(0);
  const maxRetries = 5;

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
  const [isLoading, setIsLoading] = useState(true);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPiP, setIsPiP] = useState(false);

  // Auto-hide controls timer
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

  // Detect player mode based on URL
  useEffect(() => {
    setCurrentUrl(streamUrl);
    setHasError(false);
    setIsLoading(true);
    retryCountRef.current = 0;

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

  // Cleanup player
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

  // Check token expiry
  const checkTokenExpiry = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('v');
      if (token) {
        const expiryTime = parseInt(token);
        const currentTime = Math.floor(Date.now() / 1000);
        return expiryTime > currentTime;
      }
      return true;
    } catch {
      return true;
    }
  };

  // Attempt to play with autoplay bypass
  const attemptPlay = async (video: HTMLVideoElement) => {
    try {
      // Try muted first
      video.muted = true;
      await video.play();
      setIsPlaying(true);
      setIsLoading(false);
      setHasError(false);
      
      // Unmute after successful play (if user interaction exists)
      setTimeout(() => {
        if (!isMuted) {
          video.muted = false;
          setIsMuted(false);
        }
      }, 1000);
    } catch (error) {
      console.warn('Autoplay blocked, waiting for user interaction');
      setIsLoading(false);
      setHasError(true);
      setShowControls(true);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      setIsLoading(true);
      // Try to get new token from the same domain
      const baseUrl = currentUrl.split('?')[0];
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const newUrl = response.url || currentUrl;
      if (newUrl !== currentUrl) {
        setCurrentUrl(newUrl);
        setHasError(false);
        setIsLoading(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // HLS Player Setup
  useEffect(() => {
    cleanupPlayer();
    setHasError(false);
    setIsLoading(true);

    if (playerMode === 'iframe' || playerMode === 'external') return;

    const video = videoRef.current;
    if (!video || !currentUrl) return;

    // Check token expiry
    if (!checkTokenExpiry(currentUrl)) {
      refreshToken();
      return;
    }

    if (playerMode === 'hls' && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startFragPrefetch: true,
        testBandwidth: true,
        
        // CORS & Network Config
        xhrSetup: (xhr, url) => {
          xhr.withCredentials = false;
          xhr.setRequestHeader('Origin', window.location.origin);
          xhr.setRequestHeader('Accept', '*/*');
          xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate, br');
          xhr.setRequestHeader('Connection', 'keep-alive');
          xhr.setRequestHeader('User-Agent', navigator.userAgent);
        },
        
        fetchSetup: (context, init) => {
          return new Request(context.url, {
            ...init,
            mode: 'cors',
            credentials: 'omit',
            referrerPolicy: 'no-referrer-when-downgrade',
            headers: {
              ...init.headers,
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'User-Agent': navigator.userAgent
            }
          });
        },
        
        // Retry Configuration
        retryConfig: {
          maxNumRetry: maxRetries,
          retryDelayMs: 1000,
          maxRetryDelayMs: 5000,
          backoff: 'linear'
        },
        
        // ABR Settings
        abrController: Hls.DefaultAbrController,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 1.0,
        abrMaxWithRealBitrate: true,
      });

      hlsRef.current = hls;
      hls.loadSource(currentUrl);
      hls.attachMedia(video);

      // HLS Events
      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        setIsLoading(true);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        attemptPlay(video);
      });

      hls.on(Hls.Events.FRAG_LOADING, () => {
        setIsLoading(true);
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        if (videoRef.current) {
          const buffered = videoRef.current.buffered;
          if (buffered.length > 0 && videoRef.current.duration) {
            const progress = (buffered.end(buffered.length - 1) / videoRef.current.duration) * 100;
            setBufferProgress(Math.min(100, progress));
          }
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log('Quality switched to level:', data.level);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                console.log(`Retry ${retryCountRef.current}/${maxRetries}`);
                hls.startLoad();
              } else {
                setHasError(true);
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsLoading(false);
              break;
          }
        }
      });

    } else {
      // Native player fallback
      video.src = currentUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        attemptPlay(video);
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
    }

    return () => {
      cleanupPlayer();
    };
  }, [currentUrl, playerMode]);

  // Volume control
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, volume]);

  // Playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // External player launcher
  const openInExternalApp = (target: 'mx' | 'vlc' | 'any') => {
    if (!currentUrl) return;

    const encodedUrl = encodeURIComponent(currentUrl);
    const encodedTitle = encodeURIComponent(title || 'Live Stream');
    const rawUrl = currentUrl.replace(/^https?:\/\//, '');

    let intentUri = '';

    if (target === 'mx') {
      intentUri = `intent://${rawUrl}#Intent;scheme=https;package=com.mxtech.videoplayer.ad;action=android.intent.action.VIEW;type=video/*;S.title=${encodedTitle};end;`;
    } else if (target === 'vlc') {
      intentUri = `intent://${rawUrl}#Intent;scheme=https;package=org.videolan.vlc;action=android.intent.action.VIEW;type=video/*;end;`;
    } else {
      intentUri = `intent://${rawUrl}#Intent;scheme=https;type=video/*;S.title=${encodedTitle};end;`;
    }

    // Check if Android
    if (window.navigator && window.navigator.userAgent.match(/Android/i)) {
      window.location.href = intentUri;
    } else {
      // Desktop fallback
      window.open(currentUrl, '_blank');
    }
  };

  // Fullscreen toggle
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

  // Picture-in-Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // Fullscreen change listener
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
      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-white text-sm mt-3">Loading stream...</p>
          <div className="w-48 h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${bufferProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && playerMode !== 'iframe' ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-4 text-center overflow-y-auto"
        >
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
          <h3 className="text-white text-lg font-bold mb-2">ভিডিও প্লে হতে সমস্যা হচ্ছে!</h3>
          <p className="text-slate-400 text-sm mb-4 max-w-xs">
            সার্ভার মোড পরিবর্তন করুন অথবা নিচের পছন্দের প্লেয়ার দিয়ে প্লে করুন:
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center max-w-sm mb-4">
            <button
              onClick={() => refreshToken()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow active:scale-95 transition"
            >
              <RefreshCw className="w-4 h-4" /> রিফ্রেশ
            </button>
            
            <button
              onClick={() => openInExternalApp('mx')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow active:scale-95 transition"
            >
              <PlayCircle className="w-4 h-4" /> MX Player
            </button>

            <button
              onClick={() => openInExternalApp('vlc')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow active:scale-95 transition"
            >
              <ExternalLink className="w-4 h-4" /> VLC Player
            </button>

            <button
              onClick={() => openInExternalApp('any')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow active:scale-95 transition"
            >
              <Smartphone className="w-4 h-4" /> অন্যান্য
            </button>

            <button
              onClick={() => setPlayerMode('iframe')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow active:scale-95 transition"
            >
              <RefreshCw className="w-4 h-4" /> Iframe Mode
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition"
          >
            <Settings className="w-4 h-4" /> অ্যাপ সেটিংস
          </button>
        </div>
      ) : null}

      {/* Video Player */}
      {playerMode === 'iframe' ? (
        <iframe
          src={currentUrl}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      ) : (
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          onError={() => {
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              setTimeout(() => {
                if (hlsRef.current) {
                  hlsRef.current.startLoad();
                }
              }, 2000);
            } else {
              setHasError(true);
              setIsLoading(false);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setHasError(false);
            setIsLoading(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
          onWaiting={() => {
            setIsLoading(true);
          }}
          onCanPlay={() => {
            setIsLoading(false);
          }}
          style={{ objectFit: zoomMode, backgroundColor: '#000000' }}
          className="w-full h-full absolute inset-0 z-0 bg-black cursor-pointer"
          autoPlay
          playsInline
          poster={logo}
        />
      )}

      {/* Controls Overlay */}
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
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={onClose} 
            className="bg-black/60 hover:bg-white/20 p-2.5 rounded-full text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[40%]">
            {servers?.map((srv, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentUrl(srv.url);
                  setHasError(false);
                  setIsLoading(true);
                  retryCountRef.current = 0;
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  srv.url === currentUrl 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-black/60 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Server className="w-3 h-3 inline mr-1" />
                {srv.name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={playerMode}
              onChange={(e) => {
                setPlayerMode(e.target.value as PlayerMode);
                setHasError(false);
                setIsLoading(true);
              }}
              className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-md border border-slate-700 outline-none"
            >
              <option value="hls">HLS</option>
              <option value="native">Direct</option>
              <option value="iframe">Embed</option>
            </select>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Smartphone className="w-3.5 h-3.5" /> অ্যাপ
            </button>
          </div>
        </div>

        {/* Center Controls (Play/Pause) */}
        <div className="flex items-center justify-center gap-4">
          {onPrevChannel && (
            <button 
              onClick={onPrevChannel} 
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition active:scale-95"
            >
              <SkipBack className="w-6 h-6" />
            </button>
          )}
          
          {playerMode !== 'iframe' && (
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play().catch(() => {
                      setHasError(true);
                    });
                  }
                }
              }}
              className="p-4 bg-blue-600 rounded-full text-white shadow-xl hover:bg-blue-500 transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
            </button>
          )}
          
          {onNextChannel && (
            <button 
              onClick={onNextChannel} 
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition active:scale-95"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div 
          className="flex flex-col gap-2 bg-black/80 backdrop-blur-md p-3 rounded-xl"
          style={{
            marginBottom: 'calc(4px + env(safe-area-inset-bottom))'
          }}
        >
          {duration > 0 && playerMode !== 'iframe' && (
            <input
              type="range"
              min="0"
              max="100"
              value={(currentTime / duration) * 100 || 0}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = (parseFloat(e.target.value) / 100) * duration;
                }
              }}
              className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer accent-blue-500"
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-white p-1.5 hover:bg-white/10 rounded-full transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume * 100}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) / 100;
                  setVolume(val);
                  if (val === 0) {
                    setIsMuted(true);
                  } else {
                    setIsMuted(false);
                  }
                }}
                className="w-20 h-1 bg-white/30 rounded-full cursor-pointer accent-blue-500 hidden sm:block"
              />
              
              <span className="text-white text-xs font-mono">
                {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / 
                {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
                  const currentIndex = speeds.indexOf(playbackRate);
                  const nextIndex = (currentIndex + 1) % speeds.length;
                  setPlaybackRate(speeds[nextIndex]);
                }}
                className="text-white px-2 py-1 text-xs bg-white/10 rounded-md hover:bg-white/20 transition"
              >
                {playbackRate}x
              </button>

              <button
                onClick={togglePiP}
                className="text-white p-1.5 hover:bg-white/10 rounded-full transition hidden md:block"
                title="Picture in Picture"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const modes: ZoomMode[] = ['contain', 'cover', 'fill'];
                  setZoomMode(modes[(modes.indexOf(zoomMode) + 1) % modes.length]);
                }}
                className="text-white p-1.5 hover:bg-white/10 rounded-full transition"
                title="Aspect Ratio"
              >
                <Tv className="w-4 h-4" />
              </button>
              
              <button 
                onClick={toggleFullscreen} 
                className="text-white p-1.5 hover:bg-white/10 rounded-full transition"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Player Selection Modal */}
      <PlayerSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoUrl={currentUrl}
        videoTitle={title}
        onRefresh={refreshToken}
      />
    </div>
  );
};
