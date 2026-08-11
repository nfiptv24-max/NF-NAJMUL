import React, { useEffect, useState } from 'react';
import { SportsEvent, ServerLink } from '../types';
import { DEFAULT_LOGO } from '../data/initialData';
import { Play, Trophy, Clock, Flame } from 'lucide-react';

interface EventsViewProps {
  events: SportsEvent[];
  searchQuery: string;
  onPlayStream: (url: string, servers: ServerLink[], logo: string, title: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  searchQuery,
  onPlayStream
}) => {
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [now, setNow] = useState<number>(Date.now());

  // Ticker for live match timers
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sportsList = ['All', 'Cricket', 'Football', 'Formula 1', 'Tennis', 'Basketball'];
  const statusList = ['All', 'Live', 'Upcoming'];

  const filteredEvents = events.filter((ev) => {
    const matchSport = selectedSport === 'All' || ev.sport === selectedSport;
    const matchStatus = selectedStatus === 'All' || ev.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      !q ||
      ev.tournament.toLowerCase().includes(q) ||
      ev.team1.name.toLowerCase().includes(q) ||
      ev.team2.name.toLowerCase().includes(q) ||
      (ev.name && ev.name.toLowerCase().includes(q));

    return matchSport && matchStatus && matchQuery;
  });

  const getMatchTimerText = (ev: SportsEvent) => {
    if (ev.status === 'Live') {
      const elapsed = now - (ev.startTime || now - 600000);
      if (elapsed > 0) {
        const h = Math.floor(elapsed / 3600000);
        const m = Math.floor((elapsed % 3600000) / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
      }
      return 'In Progress';
    } else {
      const dist = ev.startTime - now;
      if (dist > 0) {
        const h = Math.floor(dist / 3600000);
        const m = Math.floor((dist % 3600000) / 60000);
        const s = Math.floor((dist % 60000) / 1000);
        return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
      }
      return 'Starting Soon';
    }
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Sport Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {sportsList.map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none ${
              selectedSport === sport
                ? 'bg-blue-600/30 text-white border border-blue-500/80 shadow-md shadow-blue-500/20'
                : 'bg-[#141c32]/80 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
        {statusList.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all focus:outline-none ${
              selectedStatus === status
                ? 'bg-blue-600/30 text-white border border-blue-500/80'
                : 'bg-[#141c32]/80 text-slate-400 border border-white/10 hover:text-white'
            }`}
          >
            {status === 'Live' ? '● Live Now' : status === 'Upcoming' ? '⏳ Upcoming' : 'All Matches'}
          </button>
        ))}
      </div>

      {/* Events Cards Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-[#141c32]/50 border border-white/10 rounded-2xl p-6">
          <p className="text-sm font-semibold">No live or upcoming events match your filter</p>
          <p className="text-xs text-slate-500 mt-1">Try switching categories or clearing search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEvents.map((ev) => {
            const isLive = ev.status === 'Live';
            const timerTxt = getMatchTimerText(ev);
            const primaryServerUrl = ev.servers?.[0]?.url || ev.url || '';
            const logo = ev.logo || ev.team1.logo || DEFAULT_LOGO;
            const title = ev.name || `${ev.team1.name} vs ${ev.team2.name}`;

            return (
              <div
                key={ev.id}
                onClick={() => onPlayStream(primaryServerUrl, ev.servers, logo, title)}
                className="group cursor-pointer bg-[#141c32]/80 hover:bg-[#1e293b]/90 border border-white/10 hover:border-blue-500/50 rounded-2xl p-3.5 transition-all shadow-lg hover:shadow-blue-500/10 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                tabIndex={0}
              >
                {/* Event Top Badge */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/5">
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {ev.tournament}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isLive
                        ? 'text-red-400 bg-red-500/10 border border-red-500/20 animate-pulse'
                        : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    {isLive ? <Flame className="w-3 h-3 text-red-400" /> : <Clock className="w-3 h-3" />}
                    {isLive ? 'LIVE NOW' : 'UPCOMING'}
                  </span>
                </div>

                {/* Matchup Banner */}
                <div className="flex items-center justify-between gap-2 py-1">
                  {/* Team 1 */}
                  <div className="flex flex-col items-center text-center w-1/3">
                    <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 p-1.5 flex items-center justify-center mb-1.5 group-hover:border-blue-400/50 transition-all">
                      <img
                        src={ev.team1.logo || DEFAULT_LOGO}
                        alt={ev.team1.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-white line-clamp-1">{ev.team1.name}</span>
                    {ev.team1.score && (
                      <span className="text-[11px] font-mono font-extrabold text-blue-300 mt-0.5">{ev.team1.score}</span>
                    )}
                  </div>

                  {/* Center Timer / Score Badge */}
                  <div className="flex flex-col items-center justify-center w-1/3">
                    <div
                      className={`w-full py-1.5 px-2 rounded-xl text-center border transition-all ${
                        isLive
                          ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : 'bg-white/5 border-white/10 text-blue-400'
                      }`}
                    >
                      <span className="text-xs font-extrabold tracking-wider font-mono block">
                        {timerTxt}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-semibold group-hover:text-blue-300">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Watch Match
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="flex flex-col items-center text-center w-1/3">
                    <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 p-1.5 flex items-center justify-center mb-1.5 group-hover:border-blue-400/50 transition-all">
                      <img
                        src={ev.team2.logo || DEFAULT_LOGO}
                        alt={ev.team2.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_LOGO;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold text-white line-clamp-1">{ev.team2.name}</span>
                    {ev.team2.score && (
                      <span className="text-[11px] font-mono font-extrabold text-blue-300 mt-0.5">{ev.team2.score}</span>
                    )}
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
