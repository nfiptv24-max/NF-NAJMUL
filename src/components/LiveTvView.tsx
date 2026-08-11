import React, { useState } from 'react';
import { Channel } from '../types';
import { DEFAULT_LOGO } from '../data/initialData';
import { Heart, RotateCw, Tv } from 'lucide-react';

interface LiveTvViewProps {
  channels: Channel[];
  searchQuery: string;
  onPlayChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  favorites: string[];
  onReload: () => void;
  isLoading?: boolean;
}

export const LiveTvView: React.FC<LiveTvViewProps> = ({
  channels,
  searchQuery,
  onPlayChannel,
  onToggleFavorite,
  favorites,
  onReload,
  isLoading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories dynamically from loaded channels
  const dynamicCategories = Array.from(
    new Set(
      channels
        .map((ch) => ch.category)
        .filter((cat): cat is string => Boolean(cat) && cat.trim().length > 0)
    )
  );

  const categories = ['All', 'Favorites', ...dynamicCategories];

  const filteredChannels = channels.filter((ch) => {
    const isFav = favorites.includes(ch.id);
    if (selectedCategory === 'Favorites' && !isFav) return false;

    const matchCategory =
      selectedCategory === 'All' ||
      selectedCategory === 'Favorites' ||
      (ch.category && ch.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    const q = searchQuery.toLowerCase();
    const matchQuery =
      !q || ch.name.toLowerCase().includes(q) || (ch.category && ch.category.toLowerCase().includes(q));

    return matchCategory && matchQuery;
  });

  return (
    <div className="space-y-3 pb-6">
      {/* Category Pills & Channel Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none ${
                selectedCategory === cat
                  ? 'bg-blue-600/30 text-white border border-blue-500/80 shadow-md shadow-blue-500/20'
                  : 'bg-[#141c32]/80 text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              {cat === 'Favorites' ? '❤️ Favorites' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={onReload}
          disabled={isLoading}
          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all shrink-0 disabled:opacity-50"
          title="Reload Live TV Playlist"
        >
          <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden xs:inline">{isLoading ? 'Loading...' : 'Reload'}</span>
        </button>
      </div>

      {/* Header bar count */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <Tv className="w-4 h-4 text-blue-400" />
          <span>Live Channels ({filteredChannels.length})</span>
        </div>
        {favorites.length > 0 && (
          <span className="text-amber-400 text-[11px] font-semibold">
            {favorites.length} Saved in Favorites
          </span>
        )}
      </div>

      {/* Channels Grid */}
      {filteredChannels.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-[#141c32]/50 border border-white/10 rounded-2xl p-6">
          <p className="text-sm font-semibold">No channels found in this category</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting 'All' or searching for a channel name</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
          {filteredChannels.map((ch) => {
            const isFav = favorites.includes(ch.id);

            return (
              <div
                key={ch.id}
                onClick={() => onPlayChannel(ch)}
                className="group relative bg-[#141c32]/80 hover:bg-[#1e293b]/90 border border-white/10 hover:border-blue-500/50 rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-hidden"
                tabIndex={0}
              >
                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(ch.id);
                  }}
                  className="absolute top-1.5 right-1.5 z-10 p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isFav ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-400'
                    }`}
                  />
                </button>

                {/* Logo Wrap */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white p-1.5 flex items-center justify-center my-1.5 shadow-md group-hover:scale-105 transition-transform">
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

                {/* Channel Name */}
                <span className="text-[11px] font-bold text-white line-clamp-1 w-full px-0.5 mt-1">
                  {ch.name}
                </span>

                {ch.country && (
                  <span className="text-[9px] font-semibold text-slate-400 mt-0.5 uppercase bg-white/5 px-1.5 py-0.2 rounded-md">
                    {ch.country}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
