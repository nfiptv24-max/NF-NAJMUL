export type AppMode = 'mobile' | 'tv';

export type TabType = 'events' | 'live-tv' | 'movies' | 'playlist' | 'menu' | 'admin';

export interface ServerLink {
  name: string;
  url: string;
  quality?: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category?: string;
  groupTitle?: string;
  country?: string;
  servers: ServerLink[];
  isFavorite?: boolean;
}

export interface Team {
  name: string;
  logo: string;
  score?: string;
}

export interface SportsEvent {
  id: string;
  sport: 'Cricket' | 'Football' | 'Tennis' | 'Basketball' | 'Formula 1' | 'Motorsport' | 'Other';
  status: 'Live' | 'Upcoming' | 'Ended';
  tournament: string;
  team1: Team;
  team2: Team;
  startTime: number; // Unix timestamp
  servers: ServerLink[];
  logo?: string;
  name?: string;
  url?: string;
}

export interface Movie {
  id: string;
  name: string;
  category: 'Bangla' | 'Hindi' | 'Hollywood' | 'Bollywood' | 'South' | 'Anime';
  poster: string;
  rating?: string;
  year?: string;
  quality?: string;
  url: string;
  servers: ServerLink[];
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  logo: string;
  channelCount?: number;
  description?: string;
}

export interface PlayerStatus {
  type: 'loading' | 'buffering' | 'playing' | 'error' | 'switch' | 'idle';
  text: string;
  subText?: string;
}

export type ZoomMode = 'contain' | 'cover' | 'fill';
