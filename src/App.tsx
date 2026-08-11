import React, { useEffect, useState, useMemo } from 'react';
import {
  AppMode,
  TabType,
  Channel,
  SportsEvent,
  Movie,
  Playlist,
  ServerLink
} from './types';
import {
  INITIAL_CHANNELS,
  INITIAL_EVENTS,
  INITIAL_MOVIES,
  INITIAL_PLAYLISTS,
  DEFAULT_LOGO,
  M3U_SOURCES
} from './data/initialData';
import {
  subscribeChannels,
  subscribeEvents,
  subscribeMovies,
  subscribePlaylists,
  seedInitialFirestoreData
} from './lib/firebase';
import { parseM3U } from './utils/m3uParser';

import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { EventsView } from './components/EventsView';
import { LiveTvView } from './components/LiveTvView';
import { MoviesView } from './components/MoviesView';
import { PlaylistsView } from './components/PlaylistsView';
import { MenuView } from './components/MenuView';
import { AdminView } from './components/AdminView';
import { AdminAuthModal } from './components/AdminAuthModal';
import { BottomNav } from './components/BottomNav';
import { TvSidebar } from './components/TvSidebar';

export default function App() {
  // Mode & Tabs
  const [mode, setMode] = useState<AppMode>(() => {
    return (localStorage.getItem('nafitv_mode') as AppMode) || 'mobile';
  });
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin App vs User App separation state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const handleOpenAdminModal = () => {
    if (isAdminUnlocked) {
      setIsAdminMode(true);
      showToast('Admin App-এ স্বাগতম');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminUnlocked(true);
    setIsAdminModalOpen(false);
    setIsAdminMode(true);
    showToast('✅ Admin App আনলক সফল হয়েছে');
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      showToast('ইউজার অ্যাপে ফিরে আসা হয়েছে');
    } else {
      handleOpenAdminModal();
    }
  };

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Saved Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nafitv_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Primary Live TV Playlist URL
  const MAIN_NAFITV_M3U = 'https://raw.githubusercontent.com/nfiptv24-max/NAFITV/refs/heads/main/Nafitv24.m3u';

  // Channels state
  const [firestoreChannels, setFirestoreChannels] = useState<Channel[]>([]);
  const [m3uChannels, setM3uChannels] = useState<Channel[]>([]);
  const [isM3uLoading, setIsM3uLoading] = useState(false);

  // Events, Movies & Playlists state
  const [events, setEvents] = useState<SportsEvent[]>(INITIAL_EVENTS);
  const [movies, setMovies] = useState<Movie[]>(INITIAL_MOVIES);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);

  // Fetch Nafitv24.m3u Playlist with CORS fallbacks
  const fetchNafiTvPlaylist = async (showNotification = false) => {
    setIsM3uLoading(true);
    const urlsToTry = [
      MAIN_NAFITV_M3U,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(MAIN_NAFITV_M3U)}`,
      `https://corsproxy.io/?${encodeURIComponent(MAIN_NAFITV_M3U)}`
    ];

    let loaded = false;
    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const text = await res.text();
          const parsed = parseM3U(text);
          if (parsed && parsed.length > 0) {
            setM3uChannels(parsed);
            loaded = true;
            if (showNotification) {
              showToast(`✅ ${parsed.length} টি Live TV চ্যানেল লোড করা হয়েছে`);
            }
            break;
          }
        }
      } catch (err) {
        console.warn('Error fetching M3U playlist attempt:', url, err);
      }
    }

    if (!loaded && showNotification) {
      showToast('❌ M3U প্লেলিস্ট লোড করতে নেটওয়ার্ক সমস্যা হয়েছে');
    }
    setIsM3uLoading(false);
  };

  // Combine Firestore channels, M3U playlist channels, and Initial default channels
  const channels = useMemo(() => {
    const combined = [...firestoreChannels, ...m3uChannels, ...INITIAL_CHANNELS];
    const seenUrls = new Set<string>();
    const seenNames = new Set<string>();

    return combined.filter((ch) => {
      const nameKey = ch.name.trim().toLowerCase();
      const urlKey = ch.url?.trim().toLowerCase();

      if (urlKey && seenUrls.has(urlKey)) return false;
      if (nameKey && seenNames.has(nameKey)) return false;

      if (urlKey) seenUrls.add(urlKey);
      if (nameKey) seenNames.add(nameKey);
      return true;
    });
  }, [firestoreChannels, m3uChannels]);

  // Firestore Realtime Subscriptions & Initial M3U Fetch
  useEffect(() => {
    // Auto seed default collections on initial boot
    seedInitialFirestoreData().catch(() => {});

    // Fetch primary M3U playlist
    fetchNafiTvPlaylist(false);

    const unsubCh = subscribeChannels((data) => {
      if (data && data.length > 0) {
        setFirestoreChannels(data);
      }
    });

    const unsubEv = subscribeEvents((data) => {
      if (data && data.length > 0) {
        setEvents(data);
      }
    });

    const unsubMov = subscribeMovies((data) => {
      if (data && data.length > 0) {
        setMovies(data);
      }
    });

    const unsubPl = subscribePlaylists((data) => {
      if (data && data.length > 0) {
        setPlaylists(data);
      }
    });

    return () => {
      unsubCh();
      unsubEv();
      unsubMov();
      unsubPl();
    };
  }, []);

  // Active Video Player state
  const [activeStream, setActiveStream] = useState<{
    url: string;
    servers: ServerLink[];
    logo: string;
    title: string;
    playlistContext: Channel[];
    currentIndex: number;
  } | null>(null);

  // Sync mode to localStorage and body class
  useEffect(() => {
    localStorage.setItem('nafitv_mode', mode);
    if (mode === 'tv') {
      document.body.classList.add('tv-mode');
    } else {
      document.body.classList.remove('tv-mode');
    }
  }, [mode]);

  // Sync favorites to localStorage
  useEffect(() => {
    localStorage.setItem('nafitv_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Sync channels to localStorage
  useEffect(() => {
    localStorage.setItem('nafitv_custom_channels', JSON.stringify(channels));
  }, [channels]);

  // Background fetch remote public M3U lists to complement live channels
  useEffect(() => {
    const fetchRemoteChannels = async () => {
      for (const src of M3U_SOURCES) {
        if (src === MAIN_NAFITV_M3U) continue;
        try {
          const resp = await fetch(src, { signal: AbortSignal.timeout(8000) });
          if (resp.ok) {
            const text = await resp.text();
            const parsed = parseM3U(text);
            if (parsed.length > 0) {
              setM3uChannels((prev) => {
                const existingNames = new Set(prev.map((c) => c.name.toLowerCase()));
                const newItems = parsed.filter((c) => !existingNames.has(c.name.toLowerCase()));
                return [...prev, ...newItems];
              });
              break;
            }
          }
        } catch (_) {}
      }
    };

    fetchRemoteChannels();
  }, []);

  // Keyboard navigation listener for TV mode (D-Pad / Enter / Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && typeof activeEl.click === 'function') {
          activeEl.click();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(id);
      if (isFav) {
        showToast('Removed from favorites');
        return prev.filter((f) => f !== id);
      } else {
        showToast('Added to favorites ❤️');
        return [...prev, id];
      }
    });
  };

  // Play Stream in Sticky Player
  const handlePlayStream = (
    url: string,
    servers: ServerLink[],
    logo: string,
    title: string,
    context: Channel[] = channels,
    index: number = 0
  ) => {
    if (!url) {
      showToast('⚠️ Stream URL not available');
      return;
    }

    setActiveStream({
      url,
      servers: servers && servers.length > 0 ? servers : [{ name: 'Server 1', url }],
      logo: logo || DEFAULT_LOGO,
      title: title || 'Live Stream',
      playlistContext: context,
      currentIndex: index
    });

    showToast(`▶ Playing: ${title}`);
  };

  // Play Channel helper
  const handlePlayChannel = (channel: Channel) => {
    const idx = channels.findIndex((c) => c.id === channel.id);
    handlePlayStream(
      channel.url,
      channel.servers,
      channel.logo,
      channel.name,
      channels,
      idx !== -1 ? idx : 0
    );
  };

  // Next / Previous Channel Controls
  const handleNextChannel = () => {
    if (!activeStream || activeStream.playlistContext.length === 0) return;
    const nextIdx = (activeStream.currentIndex + 1) % activeStream.playlistContext.length;
    const nextCh = activeStream.playlistContext[nextIdx];
    handlePlayChannel(nextCh);
  };

  const handlePrevChannel = () => {
    if (!activeStream || activeStream.playlistContext.length === 0) return;
    const prevIdx =
      (activeStream.currentIndex - 1 + activeStream.playlistContext.length) %
      activeStream.playlistContext.length;
    const prevCh = activeStream.playlistContext[prevIdx];
    handlePlayChannel(prevCh);
  };

  // Auto failover when stream fails
  const handleFailoverNext = () => {
    if (!activeStream) return;
    showToast('⚠️ Stream stalled - auto switching channel...');
    handleNextChannel();
  };

  // Add Custom Channel
  const handleAddCustomChannel = (newChannel: Channel) => {
    setM3uChannels((prev) => [newChannel, ...prev]);
    showToast(`Added channel "${newChannel.name}"`);
    setActiveTab('live-tv');
  };

  // Load Remote or Local M3U Playlist into channels
  const handleLoadCustomM3UChannels = (newChannels: Channel[], name: string) => {
    setM3uChannels((prev) => [...newChannels, ...prev]);
    showToast(`Loaded ${newChannels.length} channels from ${name}`);
    setActiveTab('live-tv');
  };

  // Reset Defaults
  const handleResetDefaults = () => {
    localStorage.removeItem('nafitv_custom_channels');
    localStorage.removeItem('nafitv_favorites');
    setFavorites([]);
    fetchNafiTvPlaylist(true);
    showToast('Reset to default channels');
  };

  // Tab Title helper
  const getTabTitle = () => {
    if (isAdminMode) {
      return 'Firebase Admin Control App';
    }
    switch (activeTab) {
      case 'events':
        return 'Live Sports & Matches';
      case 'live-tv':
        return 'Live TV Channels';
      case 'movies':
        return 'Movies & Cinema';
      case 'playlist':
        return 'Curated M3U Playlists';
      case 'menu':
        return 'Custom Stream & M3U Menu';
      default:
        return 'NAFI TV 24';
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-[#eef2ff] flex flex-col font-sans">
      {/* TV Mode Sidebar */}
      {mode === 'tv' && !isAdminMode && (
        <TvSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Main Container */}
      <div className={`flex-1 flex flex-col max-w-5xl mx-auto w-full px-2 sm:px-4 ${mode === 'mobile' && !isAdminMode ? 'pb-20' : 'pb-6'}`}>
        {/* Header Bar */}
        <Header
          mode={mode}
          onSetMode={setMode}
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={() => window.location.reload()}
          title={getTabTitle()}
          isAdminActive={isAdminMode}
          onToggleAdmin={handleToggleAdminMode}
        />

        {/* Sticky Video Player */}
        {activeStream && !isAdminMode && (
          <VideoPlayer
            streamUrl={activeStream.url}
            servers={activeStream.servers}
            title={activeStream.title}
            logo={activeStream.logo}
            onClose={() => setActiveStream(null)}
            onNextChannel={handleNextChannel}
            onPrevChannel={handlePrevChannel}
            onFailoverNext={handleFailoverNext}
          />
        )}

        {/* Dynamic Views Tab Content */}
        <main className="flex-1 mt-3">
          {isAdminMode ? (
            <AdminView
              channels={channels}
              events={events}
              movies={movies}
              playlists={playlists}
              onShowToast={showToast}
              onExitAdmin={() => setIsAdminMode(false)}
            />
          ) : (
            <>
              {activeTab === 'events' && (
                <EventsView
                  events={events}
                  searchQuery={searchQuery}
                  onPlayStream={(url, servers, logo, title) =>
                    handlePlayStream(url, servers, logo, title)
                  }
                />
              )}

              {activeTab === 'live-tv' && (
                <LiveTvView
                  channels={channels}
                  searchQuery={searchQuery}
                  onPlayChannel={handlePlayChannel}
                  onToggleFavorite={handleToggleFavorite}
                  favorites={favorites}
                  isLoading={isM3uLoading}
                  onReload={() => fetchNafiTvPlaylist(true)}
                />
              )}

              {activeTab === 'movies' && (
                <MoviesView
                  movies={movies}
                  searchQuery={searchQuery}
                  onPlayMovie={(url, servers, poster, title) =>
                    handlePlayStream(url, servers, poster, title)
                  }
                />
              )}

              {activeTab === 'playlist' && (
                <PlaylistsView
                  playlists={playlists}
                  onPlayChannel={handlePlayChannel}
                />
              )}

              {activeTab === 'menu' && (
                <MenuView
                  onPlayDirectStream={(url, servers, logo, title) =>
                    handlePlayStream(url, servers, logo, title)
                  }
                  onAddCustomChannel={handleAddCustomChannel}
                  onLoadCustomM3UChannels={handleLoadCustomM3UChannels}
                  onResetDefaults={handleResetDefaults}
                  onOpenAdminModal={handleOpenAdminModal}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (User App) */}
      {mode === 'mobile' && !isAdminMode && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Admin PIN Auth Modal */}
      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] border border-blue-500/50 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
