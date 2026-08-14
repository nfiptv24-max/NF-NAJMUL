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

  // 🔧 Improved external app player function
  const playInExternalApp = (videoUrl: string, packageName?: string) => {
    if (!videoUrl) {
      console.error('❌ No video URL');
      return;
    }

    console.log('🎯 Opening URL:', videoUrl);
    console.log('📦 Package:', packageName || 'Any');

    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle);

    let intentUrl = '';

    // If packageName is provided, use specific app
    if (packageName) {
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=${packageName};S.title=${encodedTitle};end;`;
    } else {
      // Let Android choose any player
      intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;S.title=${encodedTitle};end;`;
    }

    // Check if Android
    const isAndroid = navigator.userAgent.includes('Android');
    
    if (isAndroid) {
      console.log('📱 Android detected, opening intent:', intentUrl);
      window.location.href = intentUrl;
      
      // Fallback after 2 seconds
      setTimeout(() => {
        if (!document.hidden) {
          console.log('🔄 Fallback: opening directly');
          window.open(videoUrl, '_blank');
        }
      }, 2000);
    } else {
      // Desktop/Other: Open in new tab
      console.log('💻 Non-Android, opening in browser');
      window.open(videoUrl, '_blank');
    }
  };

  // 📋 Handle network stream (copy to clipboard)
  const handleNetworkStream = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(videoUrl)
        .then(() => {
          alert('✅ Stream URL copied to clipboard!');
        })
        .catch(() => {
          prompt('📋 Copy this URL:', videoUrl);
        });
    } else {
      prompt('📋 Copy this URL:', videoUrl);
    }
  };

  // 🌐 Handle web player
  const handleWebPlayer = () => {
    // Create HTML5 video player in new tab
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

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#121318] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl"
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
          <p className="text-xs text-gray-400 mt-1">🎬 সার্ভার এবং ভিডিও প্লেয়ার নির্বাচন করুন</p>
        </div>

        {/* Stream URL */}
        <div className="mb-4 bg-gray-900/50 rounded-xl p-3 border border-gray-800">
          <p className="text-[10px] text-gray-500 mb-1">📡 স্ট্রিম URL</p>
          <p className="text-xs text-gray-300 truncate font-mono">{videoUrl}</p>
        </div>

        {/* Stream Server Selection */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 mb-2 block font-medium">📡 স্ট্রিম সার্ভার:</label>
          <div className="flex items-center justify-between bg-red-950/30 border border-red-600/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Primary Stream Server
            </div>
            <span className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded-md font-medium">Active</span>
          </div>
        </div>

        {/* Player Options Grid */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block font-medium">🎮 প্লেয়ার সিলেক্ট করুন:</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            
            {/* Web Player */}
            <button 
              onClick={() => {
                handleWebPlayer();
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <Globe className="w-6 h-6 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Web Player</span>
            </button>

            {/* MX Player */}
            <button 
              onClick={() => {
                playInExternalApp(videoUrl, 'com.mxtech.videoplayer.ad');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <span className="bg-orange-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded mb-1 group-hover:scale-110 transition-transform">MX</span>
              <span className="text-xs font-semibold">MX Player</span>
            </button>

            {/* VLC Player */}
            <button 
              onClick={() => {
                playInExternalApp(videoUrl, 'org.videolan.vlc');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <ExternalLink className="w-6 h-6 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">VLC Player</span>
            </button>

            {/* XPlayer */}
            <button 
              onClick={() => {
                playInExternalApp(videoUrl, 'mobi.inshot.videoplayer.allformat');
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <Smartphone className="w-6 h-6 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">XPlayer</span>
            </button>

          </div>

          {/* Network Stream Option */}
          <button 
            onClick={() => {
              handleNetworkStream();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-gray-900/60 border border-gray-800 hover:border-blue-500 rounded-xl transition text-xs font-semibold text-gray-300"
          >
            <Server className="w-4 h-4 text-blue-400" />
            📋 Network Stream (Copy URL)
          </button>
        </div>

      </div>
    </div>
  );
};

export default PlayerSelectionModal;
