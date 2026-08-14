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
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(navigator.userAgent.includes('Android'));
  }, []);

  if (!isOpen) return null;

  // 🎯 FIXED: Proper Intent for Android with Activity
  const playInExternalApp = (videoUrl: string, packageName: string, activityName?: string) => {
    if (!videoUrl) {
      console.error('❌ No video URL');
      return;
    }

    console.log('🎯 Opening URL:', videoUrl);
    console.log('📦 Package:', packageName);
    console.log('🎯 Activity:', activityName || 'default');

    // Check if Android
    if (!isAndroid) {
      console.log('💻 Not Android, opening in browser');
      window.open(videoUrl, '_blank');
      onClose();
      return;
    }

    // Clean URL - remove protocol
    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle || 'Video Stream');

    // Build proper Intent
    let intentUrl = '';

    if (packageName === 'com.mxtech.videoplayer.ad') {
      // 🎯 MX Player specific - with proper activity
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};package=${packageName};action=android.intent.action.VIEW;type=video/*;component=${packageName}/com.mxtech.videoplayer.ad.ActivityWelcomeMX;S.title=${encodedTitle};end;`;
    } else if (packageName === 'org.videolan.vlc') {
      // 🎯 VLC specific
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};package=${packageName};action=android.intent.action.VIEW;type=video/*;S.title=${encodedTitle};end;`;
    } else {
      // 🎯 Generic intent
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};package=${packageName};action=android.intent.action.VIEW;type=video/*;S.title=${encodedTitle};end;`;
    }

    console.log('📱 Intent URL:', intentUrl);

    try {
      // 🎯 Method 1: Direct intent (works on most devices)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = intentUrl;
      document.body.appendChild(iframe);
      
      // Remove iframe after attempt
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 3000);

      // 🎯 Method 2: Fallback with window.location (if iframe doesn't work)
      setTimeout(() => {
        // Check if page is still visible (intent failed)
        if (!document.hidden) {
          console.log('⚠️ Iframe method failed, trying window.location');
          
          // Try with different intent format
          const fallbackIntent = `intent://${rawUrl}#Intent;scheme=${scheme};package=${packageName};action=android.intent.action.VIEW;type=video/*;end;`;
          window.location.href = fallbackIntent;
        }
      }, 1500);

      // 🎯 Method 3: Open with explicit component (for MX Player)
      if (packageName === 'com.mxtech.videoplayer.ad') {
        setTimeout(() => {
          if (!document.hidden) {
            console.log('⚠️ Trying MX Player with explicit component');
            const mxIntent = `intent://${rawUrl}#Intent;scheme=${scheme};package=${packageName};component=${packageName}/com.mxtech.videoplayer.ad.ActivityWelcomeMX;action=android.intent.action.VIEW;type=video/*;end;`;
            window.location.href = mxIntent;
          }
        }, 2500);
      }

    } catch (error) {
      console.error('❌ Error opening intent:', error);
      
      // 🎯 Final fallback: Try to open with market:// to install app
      if (packageName) {
        const marketUrl = `market://details?id=${packageName}`;
        window.location.href = marketUrl;
      }
    }

    onClose();
  };

  // 🎯 Alternative method using a hidden anchor tag
  const playWithAnchor = (videoUrl: string, packageName: string) => {
    if (!isAndroid) {
      window.open(videoUrl, '_blank');
      onClose();
      return;
    }

    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle || 'Video Stream');

    let intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};package=${packageName};action=android.intent.action.VIEW;type=video/*;S.title=${encodedTitle};end;`;

    // Create hidden anchor
    const anchor = document.createElement('a');
    anchor.href = intentUrl;
    anchor.target = '_blank';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(anchor);
    }, 1000);

    onClose();
  };

  // 🌐 Web Player
  const handleWebPlayer = () => {
    const isHLS = videoUrl.includes('.m3u8');
    
    let html = '';
    
    if (isHLS) {
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
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    onClose();
  };

  // 📋 Copy URL
  const handleCopyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(videoUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
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

  // 📱 Share
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

  // 📥 Download
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      if (videoUrl.includes('.m3u8')) {
        alert('📥 HLS streams require special conversion. Use a downloader app or try the web player.');
        window.open(videoUrl, '_blank');
      } else {
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

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#121318] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
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
          {isAndroid && (
            <div className="mt-2 flex gap-1">
              <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30">
                ✅ Android ডিভাইস সনাক্ত হয়েছে
              </span>
            </div>
          )}
        </div>

        {/* Stream URL */}
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

        {/* 🎯 Player Options - FIXED with proper package names */}
        <div className="space-y-2.5">
          
          {/* Web Player */}
          <button 
            onClick={handleWebPlayer}
            className="w-full flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 hover:border-blue-500 rounded-xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold">Web Player</span>
            </div>
            <span className="text-xs text-gray-500">🌐 Browser (HLS)</span>
          </button>

          {/* 🎯 MX Player - FIXED with proper activity */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'com.mxtech.videoplayer.ad', 'com.mxtech.videoplayer.ad.ActivityWelcomeMX');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 hover:border-orange-500 rounded-xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <span className="bg-orange-500 text-black text-xs font-black px-2 py-1 rounded">MX</span>
              <span className="text-sm font-semibold">MX Player</span>
            </div>
            <span className="text-xs text-gray-500">🎬 Video Player</span>
          </button>

          {/* 🎯 VLC Player */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'org.videolan.vlc');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 hover:border-orange-600 rounded-xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🎬</span>
              <span className="text-sm font-semibold">VLC Player</span>
            </div>
            <span className="text-xs text-gray-500">📺 Media Player</span>
          </button>

          {/* 🎯 Network Player */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'com.genuine.leone');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 hover:border-blue-500 rounded-xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold">Network Player</span>
            </div>
            <span className="text-xs text-gray-500">📡 Genuine Leone</span>
          </button>

          {/* 🎯 Any Player (Default) */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, '');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-gray-900/60 border border-gray-800 hover:border-purple-500 rounded-xl transition-all hover:scale-[1.02] active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold">Any Player</span>
            </div>
            <span className="text-xs text-gray-500">📱 Default</span>
          </button>

        </div>

        {/* 🎯 Debug Info */}
        <div className="mt-4 p-2 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            ℹ️ অ্যাপ ইনস্টল থাকলে সরাসরি খুলবে। না থাকলে Play Store এ নিয়ে যাবে।
          </p>
        </div>

      </div>
    </div>
  );
};

export default PlayerSelectionModal;
