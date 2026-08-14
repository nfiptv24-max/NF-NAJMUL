import React, { useState, useEffect } from 'react';
import { Play, Globe, X, Server, Copy, Check, ExternalLink, Smartphone, Tv, Film, Music, AlertCircle, RefreshCw, Download, Share2 } from 'lucide-react';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle?: string;
  onRefresh?: () => void;
}

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoTitle = 'NAFI TV 24',
  onRefresh
}) => {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedPlayers, setDetectedPlayers] = useState<string[]>([]);

  // Detect installed players on Android
  useEffect(() => {
    const detectPlayers = () => {
      const isAndroid = navigator.userAgent.includes('Android');
      if (!isAndroid) return [];

      const detected: string[] = [];
      
      // Check by user agent
      const ua = navigator.userAgent;
      if (ua.includes('MX Player') || ua.includes('com.mxtech')) {
        detected.push('MX Player');
      }
      if (ua.includes('VLC') || ua.includes('org.videolan')) {
        detected.push('VLC');
      }

      return detected;
    };

    setDetectedPlayers(detectPlayers());
  }, []);

  if (!isOpen) return null;

  // 🎯 Enhanced Intent with proper error handling
  const playInExternalApp = (videoUrl: string, packageName: string, playerName: string) => {
    if (!videoUrl) {
      console.error('❌ No video URL');
      return;
    }

    console.log(`🎯 Opening in ${playerName}:`, videoUrl);
    console.log(`📦 Package: ${packageName}`);

    const isAndroid = navigator.userAgent.includes('Android');
    
    if (!isAndroid) {
      console.log('💻 Not Android, opening in browser');
      window.open(videoUrl, '_blank');
      onClose();
      return;
    }

    // Clean URL
    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle || 'Video Stream');

    // Multiple intent formats for better compatibility
    const intents = [
      // Primary intent
      `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=${packageName};S.title=${encodedTitle};S.infos=Video;end;`,
      // Alternative with mp4 type
      `intent://${rawUrl}#Intent;scheme=${scheme};type=video/mp4;package=${packageName};end;`,
      // Without package (let system decide)
      `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;S.title=${encodedTitle};end;`
    ];

    console.log('📱 Trying intents...');

    let intentIndex = 0;
    let intentTimeout: NodeJS.Timeout;
    let success = false;

    const tryNextIntent = () => {
      if (success || intentIndex >= intents.length) {
        // All intents failed, fallback to browser
        console.log('⚠️ All intents failed, opening in browser');
        window.open(videoUrl, '_blank');
        return;
      }

      const currentIntent = intents[intentIndex];
      console.log(`📱 Intent ${intentIndex + 1}:`, currentIntent);
      
      try {
        // Try to open intent
        window.location.href = currentIntent;
        intentIndex++;
        
        // Check if page is still visible (intent failed)
        intentTimeout = setTimeout(() => {
          if (!document.hidden && !success) {
            console.log(`⏳ Intent ${intentIndex} timed out, trying next...`);
            tryNextIntent();
          }
        }, 1500);

      } catch (error) {
        console.error(`❌ Intent ${intentIndex + 1} error:`, error);
        tryNextIntent();
      }
    };

    // Start with first intent
    tryNextIntent();

    // Cleanup timeout on unmount
    setTimeout(() => {
      if (intentTimeout) clearTimeout(intentTimeout);
    }, 5000);

    onClose();
  };

  // 🌐 Enhanced Web Player with HLS support
  const handleWebPlayer = () => {
    const isHLS = videoUrl.includes('.m3u8');
    
    let html = '';
    
    if (isHLS) {
      // HLS player with hls.js
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${videoTitle}</title>
            <style>
              * { margin: 0; padding: 0; }
              body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
              video { width: 100%; height: 100%; object-fit: contain; }
              .loading { position: absolute; color: white; font-family: Arial; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="loading">Loading HLS stream...</div>
            <video id="video" controls autoplay playsinline></video>
            <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
            <script>
              const video = document.getElementById('video');
              const loading = document.querySelector('.loading');
              
              if (Hls.isSupported()) {
                const hls = new Hls({
                  enableWorker: true,
                  lowLatencyMode: true
                });
                hls.loadSource('${videoUrl}');
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  loading.style.display = 'none';
                  video.play().catch(() => {});
                });
                hls.on(Hls.Events.ERROR, (e, data) => {
                  if (data.fatal) {
                    loading.textContent = '❌ Error loading stream. Please try another player.';
                    loading.style.color = 'red';
                  }
                });
              } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = '${videoUrl}';
                loading.style.display = 'none';
              } else {
                loading.textContent = '❌ Your browser does not support HLS streams.';
                loading.style.color = 'red';
              }
            </script>
          </body>
        </html>
      `;
    } else {
      // Standard video player
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${videoTitle}</title>
            <style>
              * { margin: 0; padding: 0; }
              body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
              video { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <video controls autoplay playsinline>
              <source src="${videoUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </body>
        </html>
      `;
    }
    
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
    
    onClose();
  };

  // 📋 Copy URL with better feedback
  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(videoUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = videoUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      prompt('📋 Copy this URL:', videoUrl);
    }
  };

  // 📱 Share URL
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: videoTitle || 'Video Stream',
          text: `Watch ${videoTitle || 'Video'} on NAFI TV 24`,
          url: videoUrl
        });
      } else {
        handleCopyUrl();
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // 📥 Download video (HLS to MP4 conversion)
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      // For HLS streams, we need to use a service or FFmpeg
      // For now, we'll try to open the stream in a new window
      if (videoUrl.includes('.m3u8')) {
        alert('📥 HLS streams require special conversion. Use a downloader app or try the web player.');
        window.open(videoUrl, '_blank');
      } else {
        // Direct download for MP4
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `${videoTitle || 'video'}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('❌ Download failed. Please try another method.');
    } finally {
      setIsLoading(false);
    }
    onClose();
  };

  // Player list with enhanced options
  const players = [
    {
      id: 'web',
      name: 'Web Player',
      icon: Globe,
      color: 'text-blue-400',
      bg: 'hover:border-blue-500',
      description: '🌐 Browser (HLS Supported)',
      action: handleWebPlayer
    },
    {
      id: 'mx',
      name: 'MX Player',
      icon: Play,
      color: 'text-orange-400',
      bg: 'hover:border-orange-500',
      description: '🎬 Best Video Player',
      action: () => playInExternalApp(videoUrl, 'com.mxtech.videoplayer.ad', 'MX Player')
    },
    {
      id: 'vlc',
      name: 'VLC Player',
      icon: ExternalLink,
      color: 'text-orange-500',
      bg: 'hover:border-orange-600',
      description: '📺 Open Source Media Player',
      action: () => playInExternalApp(videoUrl, 'org.videolan.vlc', 'VLC')
    },
    {
      id: 'network',
      name: 'Network Player',
      icon: Server,
      color: 'text-blue-400',
      bg: 'hover:border-blue-500',
      description: '📡 Genuine Leone',
      action: () => playInExternalApp(videoUrl, 'com.genuine.leone', 'Network Player')
    },
    {
      id: 'any',
      name: 'Any Player',
      icon: Smartphone,
      color: 'text-purple-400',
      bg: 'hover:border-purple-500',
      description: '📱 Default Video Player',
      action: () => playInExternalApp(videoUrl, '', 'Default')
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#121318] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full bg-gray-800/50 hover:bg-gray-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-red-600/20 to-purple-600/20 text-red-500 rounded-full flex items-center justify-center mb-3 border border-red-500/30">
            <Play className="w-7 h-7 fill-current" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {videoTitle}
          </h2>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <span>🎬</span> পছন্দের প্লেয়ার নির্বাচন করুন
          </p>
          
          {/* Detected players badge */}
          {detectedPlayers.length > 0 && (
            <div className="mt-2 flex gap-1">
              {detectedPlayers.map((player) => (
                <span key={player} className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">
                  ✅ {player} ইনস্টল আছে
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stream URL with status */}
        <div className="mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-500">📡 স্ট্রিম URL</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              videoUrl.includes('.m3u8') ? 'bg-blue-500/20 text-blue-400' : 
              videoUrl.includes('.mpd') ? 'bg-purple-500/20 text-purple-400' : 
              'bg-green-500/20 text-green-400'
            }`}>
              {videoUrl.includes('.m3u8') ? 'HLS' : 
               videoUrl.includes('.mpd') ? 'DASH' : 
               'MP4'}
            </span>
          </div>
          <p className="text-xs text-gray-300 truncate font-mono">{videoUrl}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={handleCopyUrl}
            className="flex flex-col items-center gap-1 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition group"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
            )}
            <span className="text-[10px] text-gray-500">
              {copied ? 'কপি হয়েছে' : 'কপি করুন'}
            </span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition group"
          >
            <Share2 className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
            <span className="text-[10px] text-gray-500">শেয়ার করুন</span>
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex flex-col items-center gap-1 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition group disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
            <span className="text-[10px] text-gray-500">
              {isLoading ? '...' : 'ডাউনলোড'}
            </span>
          </button>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex flex-col items-center gap-1 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition group"
            >
              <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
              <span className="text-[10px] text-gray-500">রিফ্রেশ</span>
            </button>
          )}
        </div>

        {/* Player Options */}
        <div className="space-y-2.5">
          {players.map((player) => (
            <button 
              key={player.id}
              onClick={player.action}
              className={`w-full flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 ${player.bg} rounded-xl transition-all hover:scale-[1.02] active:scale-95 group`}
            >
              <div className="flex items-center gap-3">
                <player.icon className={`w-5 h-5 ${player.color}`} />
                <span className="text-sm font-semibold">{player.name}</span>
              </div>
              <span className="text-xs text-gray-500">{player.description}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500 border-t border-gray-800 pt-3">
          <span>💡 অ্যাপ ইনস্টল থাকলে সরাসরি খুলবে</span>
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            v2.1
          </span>
        </div>

      </div>
    </div>
  );
};

export default PlayerSelectionModal;
