import { Channel, SportsEvent, Movie, Playlist } from '../types';

export const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/716/716429.png';
export const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';

export const M3U_SOURCES = [
  'https://raw.githubusercontent.com/nfiptv24-max/NAFITV/refs/heads/main/Nafitv24.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/22.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/14.m3u',
];

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    name: 'Gazi TV (GTV)',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/29/Gazi_TV_Logo.png',
    category: 'Sports',
    country: 'BD',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8',
    servers: [
      { name: 'Server 1 (HD)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8' },
      { name: 'Server 2 (FHD)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8' },
      { name: 'Server 3 (Backup)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' }
    ]
  },
  {
    id: 'ch-2',
    name: 'T Sports Live',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/channels/tsports.png',
    category: 'Sports',
    country: 'BD',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8',
    servers: [
      { name: 'Server 1', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8' },
      { name: 'Server 2', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' }
    ]
  },
  {
    id: 'ch-3',
    name: 'Star Sports 1 HD',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/channels/star-sports-1.png',
    category: 'Sports',
    country: 'IN',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8',
    servers: [
      { name: 'Server 1 HD', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' },
      { name: 'Server 2 1080p', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8' }
    ]
  },
  {
    id: 'ch-4',
    name: 'Sony Ten 1 HD',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/channels/sony-ten-1.png',
    category: 'Sports',
    country: 'IN',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8',
    servers: [
      { name: 'Server 1', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8' }
    ]
  },
  {
    id: 'ch-5',
    name: 'BBC World News',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/gb/bbc-world-news.png',
    category: 'News',
    country: 'UK',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8',
    servers: [
      { name: 'Main HQ', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8' }
    ]
  },
  {
    id: 'ch-6',
    name: 'CNN International',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/us/cnn.png',
    category: 'News',
    country: 'US',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8',
    servers: [
      { name: 'Main HD', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8' }
    ]
  },
  {
    id: 'ch-7',
    name: 'Sky News Live',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/gb/sky-news.png',
    category: 'News',
    country: 'UK',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8',
    servers: [
      { name: 'Main HD', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' }
    ]
  },
  {
    id: 'ch-8',
    name: 'Al Jazeera English',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/qa/al-jazeera.png',
    category: 'News',
    country: 'QA',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8',
    servers: [
      { name: 'Main Stream', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8' }
    ]
  },
  {
    id: 'ch-9',
    name: 'France 24 English',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/fr/france-24.png',
    category: 'News',
    country: 'FR',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/france24/index.m3u8',
    servers: [
      { name: 'Main HD', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/france24/index.m3u8' }
    ]
  },
  {
    id: 'ch-10',
    name: 'DW English HD',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/de/dw.png',
    category: 'Infotainment',
    country: 'DE',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/dw/index.m3u8',
    servers: [
      { name: 'Main HD', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/dw/index.m3u8' }
    ]
  },
  {
    id: 'ch-11',
    name: 'NHK World Japan',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/jp/nhk.png',
    category: 'Infotainment',
    country: 'JP',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/nhk/index.m3u8',
    servers: [
      { name: 'Main HD', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/nhk/index.m3u8' }
    ]
  },
  {
    id: 'ch-12',
    name: 'Arirang World',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/kr/arirang.png',
    category: 'Entertainment',
    country: 'KR',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/arirang/index.m3u8',
    servers: [
      { name: 'Main Stream', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/arirang/index.m3u8' }
    ]
  }
];

export const INITIAL_EVENTS: SportsEvent[] = [
  {
    id: 'ev-1',
    sport: 'Cricket',
    status: 'Live',
    tournament: 'ICC T20 World Cup - Final Match',
    team1: { name: 'Bangladesh', logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/bd/bd.png', score: '168/4 (18.2 ov)' },
    team2: { name: 'India', logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/in/in.png', score: '165/8 (20.0 ov)' },
    startTime: Date.now() - 45 * 60 * 1000,
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/bd/bd.png',
    name: 'Bangladesh vs India T20 Final',
    servers: [
      { name: 'Server 1 (GTV HD)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8' },
      { name: 'Server 2 (T Sports)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8' },
      { name: 'Server 3 (Star Sports)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' }
    ]
  },
  {
    id: 'ev-2',
    sport: 'Football',
    status: 'Live',
    tournament: 'UEFA Champions League',
    team1: { name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', score: '2' },
    team2: { name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', score: '1' },
    startTime: Date.now() - 65 * 60 * 1000,
    logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    name: 'El Clásico - Real Madrid vs Barcelona',
    servers: [
      { name: 'Server 1 (Sports HD)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' },
      { name: 'Server 2 (Sony Ten)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8' }
    ]
  },
  {
    id: 'ev-3',
    sport: 'Football',
    status: 'Upcoming',
    tournament: 'English Premier League',
    team1: { name: 'Manchester Utd', logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/clubs/manchester-united.png' },
    team2: { name: 'Liverpool FC', logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/clubs/liverpool.png' },
    startTime: Date.now() + 2 * 3600 * 1000 + 15 * 60 * 1000,
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/clubs/manchester-united.png',
    name: 'Manchester Utd vs Liverpool FC',
    servers: [
      { name: 'Main Stream', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' }
    ]
  },
  {
    id: 'ev-4',
    sport: 'Cricket',
    status: 'Upcoming',
    tournament: 'Asia Cup 2026',
    team1: { name: 'Pakistan', logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/pk/pk.png' },
    team2: { name: 'Sri Lanka', logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/lk/lk.png' },
    startTime: Date.now() + 5 * 3600 * 1000 + 40 * 60 * 1000,
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/pk/pk.png',
    name: 'Pakistan vs Sri Lanka',
    servers: [
      { name: 'Main Stream', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8' }
    ]
  },
  {
    id: 'ev-5',
    sport: 'Formula 1',
    status: 'Upcoming',
    tournament: 'Monaco Grand Prix 2026',
    team1: { name: 'Red Bull Racing', logo: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
    team2: { name: 'Scuderia Ferrari', logo: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png' },
    startTime: Date.now() + 18 * 3600 * 1000,
    logo: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
    name: 'F1 Grand Prix Main Race',
    servers: [
      { name: 'F1 Live Feed', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/france24/index.m3u8' }
    ]
  }
];

export const INITIAL_MOVIES: Movie[] = [
  {
    id: 'mov-1',
    name: 'Pather Panchali',
    category: 'Bangla',
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=80',
    rating: '8.5',
    year: '1955',
    quality: 'HD',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/france24/index.m3u8',
    servers: [
      { name: 'Server 1 (4K)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/france24/index.m3u8' }
    ]
  },
  {
    id: 'mov-2',
    name: 'Hawa (হাওয়া)',
    category: 'Bangla',
    poster: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=500&auto=format&fit=crop&q=80',
    rating: '8.2',
    year: '2022',
    quality: '1080p',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8',
    servers: [
      { name: 'Server 1 (FHD)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/bbcworldnews/index.m3u8' }
    ]
  },
  {
    id: 'mov-3',
    name: 'The Dark Knight',
    category: 'Hollywood',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    rating: '9.0',
    year: '2008',
    quality: '4K',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8',
    servers: [
      { name: 'Server 1 (4K)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/cnn/index.m3u8' }
    ]
  },
  {
    id: 'mov-4',
    name: 'Inception',
    category: 'Hollywood',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    rating: '8.8',
    year: '2010',
    quality: '4K',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8',
    servers: [
      { name: 'Server 1 (4K)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/skynews/index.m3u8' }
    ]
  },
  {
    id: 'mov-5',
    name: '3 Idiots',
    category: 'Bollywood',
    poster: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=500&auto=format&fit=crop&q=80',
    rating: '8.4',
    year: '2009',
    quality: 'HD',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8',
    servers: [
      { name: 'Server 1 (HD)', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/aljazeera/index.m3u8' }
    ]
  },
  {
    id: 'mov-6',
    name: 'RRR',
    category: 'South',
    poster: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80',
    rating: '7.8',
    year: '2022',
    quality: '4K HDR',
    url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/dw/index.m3u8',
    servers: [
      { name: 'Server 1', url: 'https://d2e1asnsl7br7b.cloudfront.net/ee2b5a9f-3c1f-4b7d-9b3c-5f4a7d8e9f0a/dw/index.m3u8' }
    ]
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-1',
    name: 'NAFI TV 24 Official HD',
    url: 'https://raw.githubusercontent.com/nfiptv24-max/NAFITV/refs/heads/main/Nafitv24.m3u',
    logo: 'https://cdn-icons-png.flaticon.com/512/716/716429.png',
    channelCount: 150,
    description: 'Official sports, news and entertainment collection'
  },
  {
    id: 'pl-2',
    name: 'Global World News M3U',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/22.m3u',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/country/gb/bbc-world-news.png',
    channelCount: 85,
    description: 'International news channels in HD format'
  },
  {
    id: 'pl-3',
    name: 'World Entertainment & Sports',
    url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/14.m3u',
    logo: 'https://cdn.jsdelivr.net/gh/iptv-org/icons@master/channels/star-sports-1.png',
    channelCount: 120,
    description: 'Movies, sports and music channels around the globe'
  }
];
