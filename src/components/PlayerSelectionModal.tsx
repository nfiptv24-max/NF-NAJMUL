import React from 'react';
import { Play, Globe, X, Server } from 'lucide-react';

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

  // 🎯 Improved Intent with proper flags and no fallback
  const playInExternalApp = (videoUrl: string, packageName: string) => {
    if (!videoUrl) {
      console.error('❌ No video URL');
      return;
    }

    console.log('🎯 Opening URL:', videoUrl);
    console.log('📦 Package:', packageName);

    // Check if Android
    const isAndroid = navigator.userAgent.includes('Android');
    
    if (!isAndroid) {
      console.log('💻 Not Android, opening in browser');
      window.open(videoUrl, '_blank');
      return;
    }

    // Clean URL
    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle);

    // Build Intent WITHOUT component/activity - let app handle it
    const intentUrl = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=${packageName};S.title=${encodedTitle};S.infos=Video;end;`;

    console.log('📱 Opening intent:', intentUrl);

    try {
      // Direct intent - no fallback
      window.location.href = intentUrl;
      
      // Only fallback if page doesn't hide (intent failed)
      setTimeout(() => {
        if (!document.hidden) {
          console.log('⚠️ Intent failed, trying alternate method');
          // Try with different intent format
          const altIntent = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/mp4;package=${packageName};end;`;
          window.location.href = altIntent;
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error:', error);
      // Final fallback - direct URL
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
    onClose();
  };

  // 📋 Copy URL
  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(videoUrl)
        .then(() => alert('✅ Stream URL copied to clipboard!'))
        .catch(() => prompt('📋 Copy this URL:', videoUrl));
    } else {
      prompt('📋 Copy this URL:', videoUrl);
    }
    onClose();
  };

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
            onClick={handleWebPlayer}
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
              playInExternalApp(videoUrl, 'com.mxtech.videoplayer.ad');
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
              playInExternalApp(videoUrl, 'org.videolan.vlc');
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

          {/* Network Player - Genuine Leone */}
          <button 
            onClick={() => {
              playInExternalApp(videoUrl, 'com.genuine.leone');
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

          {/* Copy URL */}
          <button 
            onClick={handleCopyUrl}
            className="w-full flex items-center justify-between p-4 bg-gray-900/60 border border-gray-800 hover:border-green-500 rounded-xl transition group"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <span className="text-sm font-semibold">Copy Stream URL</span>
            </div>
            <span className="text-xs text-gray-500">📄 Clipboard</span>
          </button>

        </div>

        <p className="text-center text-[10px] text-gray-500 mt-4">
          💡 অ্যাপ ইনস্টল থাকলে সরাসরি খুলবে
        </p>

      </div>
    </div>
  );
};

export default PlayerSelectionModal;
