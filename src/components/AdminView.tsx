import React, { useState } from 'react';
import { Channel, SportsEvent, Movie, Playlist } from '../types';
import {
  addFirestoreChannel,
  deleteFirestoreChannel,
  addFirestoreEvent,
  updateFirestoreEvent,
  deleteFirestoreEvent,
  addFirestoreMovie,
  deleteFirestoreMovie,
  addFirestorePlaylist,
  deleteFirestorePlaylist,
  seedInitialFirestoreData
} from '../lib/firebase';
import { DEFAULT_LOGO, DEFAULT_POSTER } from '../data/initialData';
import {
  ShieldCheck,
  Database,
  PlusCircle,
  Trash2,
  Edit2,
  Tv,
  Trophy,
  Film,
  FolderOpen,
  Sparkles,
  RefreshCw,
  LogOut,
  ExternalLink
} from 'lucide-react';

interface AdminViewProps {
  channels: Channel[];
  events: SportsEvent[];
  movies: Movie[];
  playlists: Playlist[];
  onShowToast: (msg: string) => void;
  onExitAdmin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  channels,
  events,
  movies,
  playlists,
  onShowToast,
  onExitAdmin
}) => {
  const [adminTab, setAdminTab] = useState<'channels' | 'events' | 'movies' | 'playlists'>('events');
  const [isSeeding, setIsSeeding] = useState(false);

  // New Channel Form
  const [chName, setChName] = useState('');
  const [chUrl, setChUrl] = useState('');
  const [chCategory, setChCategory] = useState('Sports');
  const [chLogo, setChLogo] = useState('');

  // New Event Form
  const [evSport, setEvSport] = useState<'Cricket' | 'Football' | 'Tennis' | 'Basketball' | 'Formula 1'>('Cricket');
  const [evStatus, setEvStatus] = useState<'Live' | 'Upcoming' | 'Ended'>('Live');
  const [evTournament, setEvTournament] = useState('');
  const [evTeam1Name, setEvTeam1Name] = useState('');
  const [evTeam1Score, setEvTeam1Score] = useState('');
  const [evTeam2Name, setEvTeam2Name] = useState('');
  const [evTeam2Score, setEvTeam2Score] = useState('');
  const [evStreamUrl, setEvStreamUrl] = useState('');

  // Editing event score inline state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editScore1, setEditScore1] = useState('');
  const [editScore2, setEditScore2] = useState('');
  const [editStatus, setEditStatus] = useState<'Live' | 'Upcoming' | 'Ended'>('Live');

  // New Movie Form
  const [movName, setMovName] = useState('');
  const [movCat, setMovCat] = useState<'Bangla' | 'Hindi' | 'Hollywood' | 'Bollywood' | 'South'>('Hollywood');
  const [movPoster, setMovPoster] = useState('');
  const [movUrl, setMovUrl] = useState('');

  // New Playlist Form
  const [plName, setPlName] = useState('');
  const [plUrl, setPlUrl] = useState('');
  const [plDescription, setPlDescription] = useState('');

  // Seed handler
  const handleSeedData = async () => {
    setIsSeeding(true);
    onShowToast('Seeding Firestore Database...');
    const success = await seedInitialFirestoreData();
    setIsSeeding(false);
    if (success) {
      onShowToast('✅ Firestore database seeded successfully!');
    } else {
      onShowToast('❌ Seeding failed or data already exists');
    }
  };

  // Add Channel handler
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chName || !chUrl) return;
    try {
      await addFirestoreChannel({
        name: chName,
        url: chUrl,
        category: chCategory,
        logo: chLogo || DEFAULT_LOGO,
        country: 'BD',
        servers: [{ name: 'Main', url: chUrl }]
      });
      setChName('');
      setChUrl('');
      setChLogo('');
      onShowToast('✅ Channel added to Firebase Firestore!');
    } catch (err) {
      onShowToast('❌ Failed to add channel to Firebase');
    }
  };

  // Add Event handler
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTournament || !evTeam1Name || !evTeam2Name || !evStreamUrl) return;
    try {
      await addFirestoreEvent({
        sport: evSport,
        status: evStatus,
        tournament: evTournament,
        team1: { name: evTeam1Name, logo: DEFAULT_LOGO, score: evTeam1Score },
        team2: { name: evTeam2Name, logo: DEFAULT_LOGO, score: evTeam2Score },
        startTime: Date.now(),
        logo: DEFAULT_LOGO,
        name: `${evTeam1Name} vs ${evTeam2Name}`,
        url: evStreamUrl,
        servers: [{ name: 'Server 1', url: evStreamUrl }]
      });
      setEvTournament('');
      setEvTeam1Name('');
      setEvTeam1Score('');
      setEvTeam2Name('');
      setEvTeam2Score('');
      setEvStreamUrl('');
      onShowToast('✅ Match created in Firebase!');
    } catch (err) {
      onShowToast('❌ Failed to create match');
    }
  };

  // Quick Score Update for Live Match
  const handleSaveEventScores = async (id: string, ev: SportsEvent) => {
    try {
      await updateFirestoreEvent(id, {
        status: editStatus,
        team1: { ...ev.team1, score: editScore1 },
        team2: { ...ev.team2, score: editScore2 }
      });
      setEditingEventId(null);
      onShowToast('✅ Live scores updated in Firestore!');
    } catch (err) {
      onShowToast('❌ Failed to update scores');
    }
  };

  // Add Movie handler
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movName || !movUrl) return;
    try {
      await addFirestoreMovie({
        name: movName,
        category: movCat,
        poster: movPoster || DEFAULT_POSTER,
        url: movUrl,
        quality: 'HD',
        rating: '8.0',
        year: '2026',
        servers: [{ name: 'Main', url: movUrl }]
      });
      setMovName('');
      setMovPoster('');
      setMovUrl('');
      onShowToast('✅ Movie saved to Firebase!');
    } catch (err) {
      onShowToast('❌ Failed to add movie');
    }
  };

  // Add Playlist handler
  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plName || !plUrl) return;
    try {
      await addFirestorePlaylist({
        name: plName,
        url: plUrl,
        logo: DEFAULT_LOGO,
        channelCount: 100,
        description: plDescription || 'Live channels feed'
      });
      setPlName('');
      setPlUrl('');
      setPlDescription('');
      onShowToast('✅ Playlist saved to Firebase!');
    } catch (err) {
      onShowToast('❌ Failed to add playlist');
    }
  };

  return (
    <div className="space-y-4 pb-8 max-w-4xl mx-auto">
      {/* Firebase Status Banner & Admin Controls */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-black border border-blue-500/30 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              NAFI TV 24 - Admin Control App
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firebase Realtime Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              এখানে তথ্য পরিবর্তন করলে সাথে সাথে ইউজার অ্যাপে লাইভ আপডেট হয়ে যাবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
            title="Seed Sample Data into Firestore"
          >
            {isSeeding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Sample Data</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ইউজার অ্যাপে যান</span>
          </button>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#141c32]/80 border border-white/10 p-1.5 rounded-2xl">
        <button
          onClick={() => setAdminTab('events')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            adminTab === 'events'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Sports Matches ({events.length})
        </button>
        <button
          onClick={() => setAdminTab('channels')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            adminTab === 'channels'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          Live TV Channels ({channels.length})
        </button>
        <button
          onClick={() => setAdminTab('movies')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            adminTab === 'movies'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-4 h-4" />
          Movies ({movies.length})
        </button>
        <button
          onClick={() => setAdminTab('playlists')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            adminTab === 'playlists'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Playlists ({playlists.length})
        </button>
      </div>

      {/* EVENTS MANAGEMENT TAB */}
      {adminTab === 'events' && (
        <div className="space-y-4">
          {/* Create Event Form */}
          <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              Create Live or Upcoming Sports Match
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <select
                  value={evSport}
                  onChange={(e) => setEvSport(e.target.value as any)}
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Formula 1">Formula 1</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Basketball">Basketball</option>
                </select>
                <select
                  value={evStatus}
                  onChange={(e) => setEvStatus(e.target.value as any)}
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Live">● Live Now</option>
                  <option value="Upcoming">⏳ Upcoming</option>
                  <option value="Ended">Ended</option>
                </select>
                <input
                  type="text"
                  value={evTournament}
                  onChange={(e) => setEvTournament(e.target.value)}
                  placeholder="Tournament Name"
                  required
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={evTeam1Name}
                    onChange={(e) => setEvTeam1Name(e.target.value)}
                    placeholder="Team 1 Name"
                    required
                    className="flex-1 bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={evTeam1Score}
                    onChange={(e) => setEvTeam1Score(e.target.value)}
                    placeholder="Score (e.g. 150/3)"
                    className="w-28 bg-black/40 border border-white/12 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={evTeam2Name}
                    onChange={(e) => setEvTeam2Name(e.target.value)}
                    placeholder="Team 2 Name"
                    required
                    className="flex-1 bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={evTeam2Score}
                    onChange={(e) => setEvTeam2Score(e.target.value)}
                    placeholder="Score (e.g. 148/8)"
                    className="w-28 bg-black/40 border border-white/12 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <input
                type="url"
                value={evStreamUrl}
                onChange={(e) => setEvStreamUrl(e.target.value)}
                placeholder="Stream URL (.m3u8)"
                required
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Publish Match to Firestore
              </button>
            </form>
          </div>

          {/* List Events & Live Score Editor */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 px-1">Firestore Sports Events List:</h3>
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      {ev.tournament}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        ev.status === 'Live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white">
                    {ev.team1.name} {ev.team1.score ? `(${ev.team1.score})` : ''} vs {ev.team2.name}{' '}
                    {ev.team2.score ? `(${ev.team2.score})` : ''}
                  </p>
                </div>

                {/* Edit Score or Actions */}
                {editingEventId === ev.id ? (
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                    <input
                      type="text"
                      value={editScore1}
                      onChange={(e) => setEditScore1(e.target.value)}
                      placeholder="T1 Score"
                      className="w-20 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">-</span>
                    <input
                      type="text"
                      value={editScore2}
                      onChange={(e) => setEditScore2(e.target.value)}
                      placeholder="T2 Score"
                      className="w-20 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    />
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="bg-black/60 border border-white/10 rounded-lg px-1.5 py-1 text-xs text-white"
                    >
                      <option value="Live">Live</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ended">Ended</option>
                    </select>
                    <button
                      onClick={() => handleSaveEventScores(ev.id, ev)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingEventId(ev.id);
                        setEditScore1(ev.team1.score || '');
                        setEditScore2(ev.team2.score || '');
                        setEditStatus(ev.status);
                      }}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-blue-400" />
                      Update Score
                    </button>
                    <button
                      onClick={async () => {
                        await deleteFirestoreEvent(ev.id);
                        onShowToast('Deleted match');
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHANNELS TAB */}
      {adminTab === 'channels' && (
        <div className="space-y-4">
          <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              Add Channel to Firestore
            </h3>
            <form onSubmit={handleAddChannel} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={chName}
                  onChange={(e) => setChName(e.target.value)}
                  placeholder="Channel Name"
                  required
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <select
                  value={chCategory}
                  onChange={(e) => setChCategory(e.target.value)}
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Sports">Sports</option>
                  <option value="News">News</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Infotainment">Infotainment</option>
                  <option value="Bangla">Bangla</option>
                </select>
              </div>
              <input
                type="url"
                value={chUrl}
                onChange={(e) => setChUrl(e.target.value)}
                placeholder="Stream URL (.m3u8)"
                required
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="url"
                value={chLogo}
                onChange={(e) => setChLogo(e.target.value)}
                placeholder="Logo URL (Optional)"
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Add Channel
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {channels.map((ch) => (
              <div
                key={ch.id}
                className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shrink-0">
                    <img src={ch.logo || DEFAULT_LOGO} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{ch.name}</p>
                    <p className="text-[10px] text-slate-400">{ch.category}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await deleteFirestoreChannel(ch.id);
                    onShowToast('Deleted channel');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOVIES TAB */}
      {adminTab === 'movies' && (
        <div className="space-y-4">
          <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              Add Movie to Firestore
            </h3>
            <form onSubmit={handleAddMovie} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={movName}
                  onChange={(e) => setMovName(e.target.value)}
                  placeholder="Movie Title"
                  required
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <select
                  value={movCat}
                  onChange={(e) => setMovCat(e.target.value as any)}
                  className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Bangla">Bangla</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Hollywood">Hollywood</option>
                  <option value="Bollywood">Bollywood</option>
                  <option value="South">South</option>
                </select>
              </div>
              <input
                type="url"
                value={movUrl}
                onChange={(e) => setMovUrl(e.target.value)}
                placeholder="Movie Stream URL"
                required
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="url"
                value={movPoster}
                onChange={(e) => setMovPoster(e.target.value)}
                placeholder="Poster Image URL"
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Add Movie
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {movies.map((m) => (
              <div
                key={m.id}
                className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={m.poster || DEFAULT_POSTER} alt="" className="w-9 h-12 object-cover rounded-lg shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.category}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await deleteFirestoreMovie(m.id);
                    onShowToast('Deleted movie');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PLAYLISTS TAB */}
      {adminTab === 'playlists' && (
        <div className="space-y-4">
          <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              Add Playlist to Firestore
            </h3>
            <form onSubmit={handleAddPlaylist} className="space-y-2.5">
              <input
                type="text"
                value={plName}
                onChange={(e) => setPlName(e.target.value)}
                placeholder="Playlist Title"
                required
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="url"
                value={plUrl}
                onChange={(e) => setPlUrl(e.target.value)}
                placeholder="M3U Playlist URL (e.g. https://.../list.m3u)"
                required
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={plDescription}
                onChange={(e) => setPlDescription(e.target.value)}
                placeholder="Short Description"
                className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Add Playlist
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{pl.url}</p>
                </div>
                <button
                  onClick={async () => {
                    await deleteFirestorePlaylist(pl.id);
                    onShowToast('Deleted playlist');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
