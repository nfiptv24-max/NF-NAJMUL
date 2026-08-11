import React from 'react';
import { Play, Tv, Smartphone, RefreshCw, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { AppMode, TabType } from '../types';

interface HeaderProps {
  mode: AppMode;
  onSetMode: (mode: AppMode) => void;
  activeTab: TabType;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  title: string;
  isAdminActive?: boolean;
  onToggleAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSetMode,
  searchQuery,
  onSearchChange,
  onRefresh,
  title,
  isAdminActive = false,
  onToggleAdmin
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#060913]/90 backdrop-blur-md border-b border-white/10 px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-lg ${
          isAdminActive 
            ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10'
            : 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-blue-500/10'
        }`}>
          {isAdminActive ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Play className="w-5 h-5 fill-blue-400" />}
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5 leading-none">
            NAFI TV 24
            {isAdminActive ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                ADMIN APP
              </span>
            ) : (
              <span className="live-dot" />
            )}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">{title}</p>
        </div>
      </div>

      {/* Quick Search Input */}
      <div className="hidden sm:flex items-center relative flex-1 max-w-xs mx-2">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search channels, events, movies..."
          className="w-full bg-black/40 border border-white/10 rounded-full pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-all"
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5">
        <div className="bg-white/5 border border-white/10 rounded-full p-0.5 flex items-center gap-0.5">
          <button
            onClick={() => onSetMode('mobile')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'mobile'
                ? 'bg-blue-600/30 text-white border border-blue-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mobile Layout"
          >
            <Smartphone className="w-3 h-3" />
            <span className="hidden xs:inline">Mobile</span>
          </button>
          <button
            onClick={() => onSetMode('tv')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'tv'
                ? 'bg-blue-600/30 text-white border border-blue-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="TV Layout"
          >
            <Tv className="w-3 h-3" />
            <span className="hidden xs:inline">TV</span>
          </button>
        </div>

        {onToggleAdmin && (
          <button
            onClick={onToggleAdmin}
            className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              isAdminActive
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={isAdminActive ? 'Switch to User App' : 'Switch to Admin App'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {isAdminActive ? 'User App' : 'Admin App'}
            </span>
          </button>
        )}

        <button
          onClick={onRefresh}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          title="Refresh Data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
