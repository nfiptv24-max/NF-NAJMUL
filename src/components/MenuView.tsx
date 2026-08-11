import React, { useState } from 'react';
import { Channel, ServerLink } from '../types';
import { parseM3U } from '../utils/m3uParser';
import { DEFAULT_LOGO } from '../data/initialData';
import {
  Link,
  Upload,
  PlusCircle,
  Play,
  RotateCcw,
  Info,
  Tv,
  ListPlus,
  ShieldCheck,
  Lock
} from 'lucide-react';

interface MenuViewProps {
  onPlayDirectStream: (url: string, servers: ServerLink[], logo: string, title: string) => void;
  onAddCustomChannel: (channel: Channel) => void;
  onLoadCustomM3UChannels: (channels: Channel[], playlistName: string) => void;
  onResetDefaults: () => void;
  onOpenAdminModal: () => void;
}

export const MenuView: React.FC<MenuViewProps> = ({
  onPlayDirectStream,
  onAddCustomChannel,
  onLoadCustomM3UChannels,
  onResetDefaults,
  onOpenAdminModal
}) => {
  // Direct stream state
  const [directUrl, setDirectUrl] = useState('');
  const [directTitle, setDirectTitle] = useState('');

  // Remote M3U URL state
  const [m3uUrl, setM3uUrl] = useState('');
  const [isM3uLoading, setIsM3uLoading] = useState(false);
  const [m3uStatus, setM3uStatus] = useState<string | null>(null);

  // Custom channel state
  const [customName, setCustomName] = useState('');
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customCategory, setCustomCategory] = useState('Sports');

  // Direct Stream handler
  const handlePlayDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    const title = directTitle.trim() || 'Direct Stream';
    onPlayDirectStream(
      directUrl.trim(),
      [{ name: 'Main', url: directUrl.trim() }],
      DEFAULT_LOGO,
      title
    );
  };

  // Remote M3U URL loader
  const handleLoadRemoteM3u = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrl.trim()) return;

    setIsM3uLoading(true);
    setM3uStatus('Fetching remote M3U playlist...');

    try {
      const resp = await fetch(m3uUrl.trim(), { signal: AbortSignal.timeout(12000) });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const text = await resp.text();
      const channels = parseM3U(text);
      if (channels.length === 0) {
        setM3uStatus('❌ No channels found in M3U playlist.');
      } else {
        setM3uStatus(`✅ Loaded ${channels.length} channels successfully!`);
        onLoadCustomM3UChannels(channels, 'Remote M3U Playlist');
      }
    } catch (err: any) {
      setM3uStatus(`❌ Failed to fetch: ${err.message || 'Network Error'}`);
    } finally {
      setIsM3uLoading(false);
    }
  };

  // Local M3U File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const channels = parseM3U(text);
        if (channels.length > 0) {
          setM3uStatus(`✅ Loaded ${channels.length} channels from ${file.name}!`);
          onLoadCustomM3UChannels(channels, file.name);
        } else {
          setM3uStatus('❌ Could not parse any channels from file.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Add Custom Channel
  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customStreamUrl.trim()) return;

    const newChannel: Channel = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      logo: customLogoUrl.trim() || DEFAULT_LOGO,
      url: customStreamUrl.trim(),
      category: customCategory,
      servers: [{ name: 'Server 1', url: customStreamUrl.trim() }]
    };

    onAddCustomChannel(newChannel);
    setCustomName('');
    setCustomStreamUrl('');
    setCustomLogoUrl('');
    setM3uStatus(`✅ Added "${newChannel.name}" to Live TV list!`);
  };

  return (
    <div className="space-y-4 pb-8 max-w-2xl mx-auto">
      {/* Play Direct Stream Link */}
      <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
          <Play className="w-4 h-4 text-blue-400" />
          Play Direct Stream Link (HLS / DASH / MP4)
        </h3>
        <form onSubmit={handlePlayDirect} className="space-y-2.5">
          <input
            type="url"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="Enter stream URL (e.g. https://.../stream.m3u8)"
            required
            className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={directTitle}
              onChange={(e) => setDirectTitle(e.target.value)}
              placeholder="Stream Title (Optional)"
              className="flex-1 bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 shrink-0"
            >
              Play Now
            </button>
          </div>
        </form>
      </div>

      {/* Load M3U Remote URL or Local File */}
      <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Link className="w-4 h-4 text-blue-400" />
          Load Custom M3U Playlist
        </h3>

        {/* Remote URL Form */}
        <form onSubmit={handleLoadRemoteM3u} className="flex gap-2">
          <input
            type="url"
            value={m3uUrl}
            onChange={(e) => setM3uUrl(e.target.value)}
            placeholder="Remote M3U URL (e.g. https://.../list.m3u)"
            required
            className="flex-1 bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={isM3uLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 shrink-0 disabled:opacity-50"
          >
            {isM3uLoading ? 'Loading...' : 'Load'}
          </button>
        </form>

        {/* File Upload Option */}
        <div className="border-t border-white/5 pt-3">
          <label className="flex items-center justify-center gap-2 w-full p-2.5 bg-black/30 hover:bg-black/50 border border-dashed border-white/20 rounded-xl cursor-pointer text-xs font-semibold text-slate-300 hover:text-white transition-all">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Upload .m3u / .m3u8 File from Device</span>
            <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {m3uStatus && (
          <div className="p-2.5 bg-black/40 rounded-xl text-xs font-semibold text-blue-300 text-center border border-white/10">
            {m3uStatus}
          </div>
        )}
      </div>

      {/* Add Custom Channel */}
      <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-3">
          <PlusCircle className="w-4 h-4 text-blue-400" />
          Add Custom TV Channel
        </h3>
        <form onSubmit={handleAddChannel} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Channel Name (e.g. Sports HD)"
              required
              className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
            <select
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
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
            value={customStreamUrl}
            onChange={(e) => setCustomStreamUrl(e.target.value)}
            placeholder="Stream URL (.m3u8 or video link)"
            required
            className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <input
            type="url"
            value={customLogoUrl}
            onChange={(e) => setCustomLogoUrl(e.target.value)}
            placeholder="Logo Image URL (Optional)"
            className="w-full bg-black/40 border border-white/12 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
          >
            <ListPlus className="w-4 h-4" />
            Add to Live TV List
          </button>
        </form>
      </div>

      {/* Admin Panel Access Button */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-black border border-blue-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              এডমিন অ্যাপ (Admin Control Panel)
              <Lock className="w-3 h-3 text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              চ্যানেল, লাইভ খেলা, মুভি ও প্লেলিস্ট নিয়ন্ত্রণের জন্য এডমিন অ্যাপে ঢুকুন
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAdminModal}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Login</span>
        </button>
      </div>

      {/* App Information & Cache Reset */}
      <div className="bg-[#141c32]/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-400" />
          About NAFI TV 24
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          NAFI TV 24 is a full-featured Live TV, Sports & M3U Media Streaming web application.
          Features include custom HLS stream decoding, auto-failover servers, mobile & TV remote
          compatible layouts, M3U file upload parsing, and live matchup countdowns.
        </p>

        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">Version 2.4.0 (Build 2026)</span>
          <button
            onClick={onResetDefaults}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
