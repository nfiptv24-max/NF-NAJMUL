import React from 'react';
import { TabType } from '../types';
import { Trophy, Tv, Film, FolderOpen, Menu, Play, ShieldCheck } from 'lucide-react';

interface TvSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TvSidebar: React.FC<TvSidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'events', label: 'Events', icon: <Trophy className="w-5 h-5" /> },
    { id: 'live-tv', label: 'Live TV', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'Movies', icon: <Film className="w-5 h-5" /> },
    { id: 'playlist', label: 'Playlist', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" /> }
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-50 w-16 bg-[#0a0f1e]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col items-center py-4 gap-4">
      {/* Brand logo */}
      <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-2">
        <Play className="w-5 h-5 fill-blue-400" />
      </div>

      {/* Nav items */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              tabIndex={0}
              title={tab.label}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                isActive
                  ? 'bg-blue-600/30 text-white border border-blue-500/80 shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {tab.icon}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
