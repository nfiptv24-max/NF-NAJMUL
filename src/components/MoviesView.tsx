import React, { useState } from 'react';
import { Movie, ServerLink } from '../types';
import { DEFAULT_POSTER } from '../data/initialData';
import { Play, Star, Film } from 'lucide-react';

interface MoviesViewProps {
  movies: Movie[];
  searchQuery: string;
  onPlayMovie: (url: string, servers: ServerLink[], poster: string, title: string) => void;
}

export const MoviesView: React.FC<MoviesViewProps> = ({
  movies,
  searchQuery,
  onPlayMovie
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Bangla', 'Hindi', 'Hollywood', 'Bollywood', 'South'];

  const filteredMovies = movies.filter((m) => {
    const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchQuery = !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);

    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-3 pb-6">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none ${
              selectedCategory === cat
                ? 'bg-blue-600/30 text-white border border-blue-500/80 shadow-md shadow-blue-500/20'
                : 'bg-[#141c32]/80 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <Film className="w-4 h-4 text-blue-400" />
          <span>Movies Collection ({filteredMovies.length})</span>
        </div>
      </div>

      {/* Movies Poster Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-[#141c32]/50 border border-white/10 rounded-2xl p-6">
          <p className="text-sm font-semibold">No movies found in this category</p>
          <p className="text-xs text-slate-500 mt-1">Try switching to 'All' or search for a movie title</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredMovies.map((mov) => {
            const primaryUrl = mov.servers?.[0]?.url || mov.url || '';

            return (
              <div
                key={mov.id}
                onClick={() => onPlayMovie(primaryUrl, mov.servers, mov.poster || DEFAULT_POSTER, mov.name)}
                className="group relative bg-[#141c32]/80 hover:bg-[#1e293b]/90 border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all transform hover:-translate-y-1 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                tabIndex={0}
              >
                {/* Poster Container */}
                <div className="relative aspect-[2/3] w-full bg-slate-800 overflow-hidden">
                  <img
                    src={mov.poster || DEFAULT_POSTER}
                    alt={mov.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_POSTER;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Quality Badge */}
                  {mov.quality && (
                    <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
                      {mov.quality}
                    </span>
                  )}

                  {/* Rating Badge */}
                  {mov.rating && (
                    <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {mov.rating}
                    </span>
                  )}

                  {/* Hover Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Movie Title info */}
                <div className="p-2.5 bg-[#141c32]">
                  <h3 className="text-xs font-bold text-white line-clamp-1">{mov.name}</h3>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1">
                    <span>{mov.category}</span>
                    {mov.year && <span>{mov.year}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
