import React from 'react';
import { Play, Globe, X, Server, ExternalLink, Smartphone } from 'lucide-react';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle?: string;
}

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoTitle = 'NAFI TV 24'
}) => {
  if (!isOpen) return null;

  // 🎯 Proper Intent with Activity and Flags
  const playInExternalApp = (videoUrl: string, packageName: string, activityName?: string) => {
    if (!videoUrl) {
      console.error('❌ No video URL');
      return;
    }

    console.log('🎯 Opening URL:', videoUrl);
    console.log('📦 Package:', packageName);
    console.log('🎯 Activity:', activityName || 'Default');

    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle);

    // Build Intent with Component (Activity)
    let intentUrl = '';
    
    if (activityName) {
      // Specific Activity
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=${packageName};component=${packageName}/${activityName};S.title=${encodedTitle};end;`;
    } else {
      // Default Activity
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=${packageName};S.title=${encodedTitle};end;`;
    }

    const isAndroid = navigator.userAgent.includes('Android');
    
    if (isAndroid) {
      console.log('📱 Opening intent:', intentUrl);
      
      // Try multiple methods to open
      try {
        // Method 1: Direct intent
        window.location.href = intentUrl;
        
        // Method 2: Fallback with iframe (for some browsers)
        setTimeout(() => {
          if (!document.hidden) {
            console.log('🔄 Fallback 1: Trying alternative method');
            // Try with market://
            const marketUrl = `market://details?id=${packageName}`;
            window.location.href = marketUrl;
          }
        }, 1500);

        // Method 3: Final fallback - open directly
        setTimeout(() => {
          if (!document.hidden) {
            console.log('🔄 Fallback 2: Opening directly');
            window.open(videoUrl, '_blank');
          }
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error opening app:', error);
        window.open(videoUrl, '_blank');
      }
    } else {
      // Desktop: Open in new tab
      window.open(videoUrl, '_blank');
    }
  };

  // 🌐 Web Player
  const handleWebPlayer = () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${videoTitle}</title>
          <style>
            * { margin: 0; padding: 0; }
            body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
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
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  // 📋 Network Stream
  const handleNetworkStream = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(videoUrl)
        .then(() => alert('✅ Stream URL copied to clipboard!'))
        .catch(() => prompt('📋 Copy this URL:', videoUrl));
    } else {
      prompt('📋 Copy this URL:', videoUrl);
    }
  };

  // 🎯 Player Configurations with proper Activities
  const players = [
    {
      id: 'mx',
      label: 'MX Player',
      icon: 'MX',
      color: 'bg-orange-500',
      package: 'com.mxtech.videoplayer.ad',
      activity: 'com.mxtech.videoplayer.ad.ActivityWelcomeMX'
    },
    {
      id: 'vlc',
      label: 'VLC Player',
      icon: '🎬',
      color: 'bg-orange-600',
      package: 'org.videolan.vlc',
      activity: 'org.videolan.vlc.StartActivity'
    },
    {
      id: 'network',
      label: 'Network Player',
      icon: '📡',
      color: 'bg-blue-600',
      package: 'com.genuine.leone',
      activity: 'com.genuine.leone.ui.splash.SplashActivity'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#121318] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-gray-800/50 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-2">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-xl font-bold">{videoTitle}</h2>
          <p className="text-xs text-gray-400 mt-1">🎬 পছন্দের প্লেয়ার নির্বাচন করুন</p>
        </div>

        {/* Stream URL */}
        <div className="mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-800">
          <p className="text-[10px] text-gray-500 mb-1">📡 স্ট্রিম URL</p>
          <p className="text-xs text-gray-300 truncate font-mono">{videoUrl}</p>
        </div>

        {/* Player Options */}
        <div className="space-y-3">
          
          {/* Web Player */}
          <button 
            onClick={() => {
              handleWebPlayer();
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold">Web Player</span>
            </div>
            <span className="text-xs text-gray-500">🌐 Browser</span>
          </button>

          {/* MX Player */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'com.mxtech.videoplayer.ad', 'com.mxtech.videoplayer.ad.ActivityWelcomeMX');
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 hover:border-orange-500 rounded-xl transition group"
          >
            <div className="flex items-center gap-3">
              <span className="bg-orange-500 text-black text-xs font-black px-2 py-1 rounded">MX</span>
              <span className="text-sm font-semibold">MX Player</span>
            </div>
            <span className="text-xs text-gray-500">🎬 Video Player</span>
          </button>

          {/* VLC Player */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'org.videolan.vlc', 'org.videolan.vlc.StartActivity');
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 hover:border-orange-600 rounded-xl transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🎬</span>
              <span className="text-sm font-semibold">VLC Player</span>
            </div>
            <span className="text-xs text-gray-500">📺 Media Player</span>
          </button>

          {/* Network Player (Genuine Leone) */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'com.genuine.leone', 'com.genuine.leone.ui.splash.SplashActivity');
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 hover:border-blue-500 rounded-xl transition group"
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold">Network Player</span>
            </div>
            <span className="text-xs text-gray-500">📡 Genuine Leone</span>
          </button>

          {/* Network Stream - Copy URL */}
          <button 
            onClick={() => {
              handleNetworkStream();
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 hover:border-green-500 rounded-xl transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <span className="text-sm font-semibold">Copy Stream URL</span>
            </div>
            <span className="text-xs text-gray-500">📄 Clipboard</span>
          </button>

        </div>

        {/* Note */}
        <p className="text-center text-[10px] text-gray-500 mt-4">
          💡 অ্যাপ ইনস্টল না থাকলে Play Store এ নিয়ে যাবে
        </p>

      </div>
    </div>
  );
};

export default PlayerSelectionModal;
