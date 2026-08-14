import React from 'react';
import { Play, Globe, X, Server } from 'lucide-react';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle?: string;
}

const playInExternalApp = (videoUrl: string, packageName: string) => {
  if (!videoUrl) return;
  // Intent URL for Android to open specific player app directly
  const intentUrl = `intent:${videoUrl}#Intent;type=video/*;package=${packageName};end;`;
  window.location.href = intentUrl;
};

export const PlayerSelectionModal: React.FC<PlayerSelectionModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoTitle
}) => {
  if (!isOpen) return null;

  const handlePlayerSelect = (playerType: string) => {
    switch (playerType) {
      case 'mx':
        playInExternalApp(videoUrl, 'com.mxtech.videoplayer.ad');
        break;
      case 'vlc':
        playInExternalApp(videoUrl, 'org.videolan.vlc');
        break;
      case 'xplayer':
        playInExternalApp(videoUrl, 'mobi.inshot.videoplayer.allformat');
        break;
      case 'network':
        // Network stream URL copy or open in generic intent
        navigator.clipboard?.writeText(videoUrl);
        alert('Stream URL copied to clipboard!');
        break;
      case 'web':
      default:
        onClose();
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#121318] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-gray-800/50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mb-2">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-xl font-bold">{videoTitle || 'NAFI TV 24'}</h2>
          <p className="text-xs text-gray-400 mt-1">সার্ভার এবং ভিডিও প্লেয়ার নির্বাচন করুন</p>
        </div>

        {/* Stream Server Selection */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 mb-2 block font-medium">স্ট্রিম সার্ভার সিলেক্ট করুন:</label>
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
          <label className="text-xs text-gray-400 mb-2 block font-medium">প্লেয়ার সিলেক্ট করুন:</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            
            {/* Web Player */}
            <button 
              onClick={() => handlePlayerSelect('web')}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <Globe className="w-6 h-6 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Web Player</span>
            </button>

            {/* MX Player */}
            <button 
              onClick={() => handlePlayerSelect('mx')}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <span className="bg-orange-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded mb-1 group-hover:scale-110 transition-transform">MX</span>
              <span className="text-xs font-semibold">MX Player</span>
            </button>

            {/* VLC Player */}
            <button 
              onClick={() => handlePlayerSelect('vlc')}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <span className="text-orange-400 text-lg mb-0.5 group-hover:scale-110 transition-transform">🟧</span>
              <span className="text-xs font-semibold">VLC Player</span>
            </button>

            {/* XPlayer */}
            <button 
              onClick={() => handlePlayerSelect('xplayer')}
              className="flex flex-col items-center justify-center p-4 bg-gray-900/60 border border-gray-800 hover:border-red-500 rounded-xl transition group"
            >
              <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 group-hover:scale-110 transition-transform">XP</span>
              <span className="text-xs font-semibold">XPlayer</span>
            </button>

          </div>

          {/* Network Stream Option */}
          <button 
            onClick={() => handlePlayerSelect('network')}
            className="w-full flex items-center justify-center gap-2 p-3 bg-gray-900/60 border border-gray-800 hover:border-blue-500 rounded-xl transition text-xs font-semibold text-gray-300"
          >
            <Server className="w-4 h-4 text-blue-400" />
            Network Stream
          </button>
        </div>

      </div>
    </div>
  );
};

export default PlayerSelectionModal;
