import React, { useState } from 'react';
import { Playlist, Channel } from '../types';
import { DEFAULT_LOGO } from '../data/initialData';
import { parseM3U } from '../utils/m3uParser';
import { FolderOpen, ArrowLeft, Loader2, ListVideo, Search } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onPlayChannel: (channel: Channel) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  onPlayChannel
}) => {
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [playlistChannels, setPlaylistChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');

  const handleOpenPlaylist = async (pl: Playlist) => {
    setActivePlaylist(pl);
    setIsLoading(true);
    setErrorMsg(null);
    setPlaylistChannels([]);

    const urlsToTry = [
      pl.url,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(pl.url)}`,
      `https://corsproxy.io/?${encodeURIComponent(pl.url)}`
    ];

    let foundChannels: Channel[] = [];
    let lastError = '';

    for (const url of urlsToTry) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (resp.ok) {
          const text = await resp.text();
          const parsed = parseM3U(text);
          if (parsed && parsed.length > 0) {
            foundChannels = parsed;
            break;
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Network error';
      }
    }

    if (foundChannels.length > 0) {
      setPlaylistChannels(foundChannels);
    } else {
      setErrorMsg(`Failed to fetch remote playlist (${lastError || 'No playable channels found'})`);
    }
    setIsLoading(false);
  };

  const handleBackToDirectory = () => {
    setActivePlaylist(null);
    setPlaylistChannels([]);
    setErrorMsg(null);
  };

  const filteredChannels = playlistChannels.filter((ch) => {
    const q = filterQuery.toLowerCase();
    return !q || ch.name.toLowerCase().includes(q) || (ch.category && ch.category.toLowerCase().includes(q));
  });

  if (activePlaylist) {
    return (
      <div className="space-y-3 pb-6">
        {/* Back Button & Playlist Title */}
        <div className="flex items-center justify-between bg-[#141c32]/80 border border-white/10 p-3 rounded-2xl">
          <button
            onClick={handleBackToDirectory}
            className="px-3 py-1.5 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </button>
          <div className="text-right">
            <h2 className="text-xs font-bold text-white line-clamp-1">{activePlaylist.name}</h2>
            <span className="text-[10px] text-slate-400 font-medium">
              {playlistChannels.length} Channels Loaded
            </span>
          </div>
        </div>

        {/* Filter search bar inside active playlist */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search within this playlist..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center py-16 text-slate-400 bg-[#141c32]/50 border border-white/10 rounded-2xl p-6">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">Fetching and parsing M3U playlist...</p>
            <p className="text-[11px] text-slate-500 mt-1">Please wait a few seconds</p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="text-center py-8 text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <p className="text-xs font-bold">{errorMsg}</p>
            <button
              onClick={() => handleOpenPlaylist(activePlaylist)}
              className="mt-3 px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-white text-xs font-semibold"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* Channels Grid from M3U */}
        {!isLoading && !errorMsg && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {filteredChannels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => onPlayChannel(ch)}
                className="group relative bg-[#141c32]/80 hover:bg-[#1e293b]/90 border border-white/10 hover:border-blue-500/50 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                tabIndex={0}
              >
                <div className="w-12 h-12 rounded-full bg-white p-1.5 flex items-center justify-center my-1 shadow-md group-hover:scale-105 transition-transform">
                  <img
                    src={ch.logo || DEFAULT_LOGO}
                    alt={ch.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                    }}
                    className="max-w-full max-h-full object-contain rounded-full"
                  />
                </div>
                <span className="text-[11px] font-bold text-white line-clamp-1 w-full px-0.5 mt-1">
                  {ch.name}
                </span>
                {ch.category && (
                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5 line-clamp-1">
                    {ch.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <span>Curated M3U Playlists ({playlists.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => handleOpenPlaylist(pl)}
            className="group bg-[#141c32]/80 hover:bg-[#1e293b]/90 border border-white/10 hover:border-blue-500/50 rounded-2xl p-4 flex items-center gap-3.5 transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            tabIndex={0}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 p-2 flex items-center justify-center shrink-0 group-hover:border-blue-400/50 transition-all">
              <img
                src={pl.logo || DEFAULT_LOGO}
                alt={pl.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                }}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white line-clamp-1">{pl.name}</h3>
              {pl.description && (
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{pl.description}</p>
              )}
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 mt-1">
                <ListVideo className="w-3 h-3" />
                <span>{pl.channelCount || 100}+ Streams</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
