import React from 'react';
import { TabType } from '../types';
import { Trophy, Tv, Film, FolderOpen, Menu, ShieldCheck } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'events', label: 'Events', icon: <Trophy className="w-5 h-5" /> },
    { id: 'live-tv', label: 'Live TV', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'Movies', icon: <Film className="w-5 h-5" /> },
    { id: 'playlist', label: 'Playlist', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" /> }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around py-1.5 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-blue-400 font-bold' : 'text-slate-400 font-medium hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                isActive ? 'bg-blue-500/20 text-blue-400' : ''
              }`}
            >
              {tab.icon}
            </div>
            <span className="text-[10px] leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
