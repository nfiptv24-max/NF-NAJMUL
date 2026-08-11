import { Channel } from '../types';

const DEFAULT_LOGO = 'https://cdn-icons-png.flaticon.com/512/716/716429.png';

export function parseM3U(text: string): Channel[] {
  const lines = text.split(/\r?\n/);
  const channels: Channel[] = [];
  let current: Partial<Channel> | null = null;
  let counter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      current = {
        id: `m3u-${counter++}`,
        name: 'Channel',
        logo: DEFAULT_LOGO,
        url: '',
        category: 'General',
        servers: []
      };

      // Extract logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch && logoMatch[1]) {
        current.logo = logoMatch[1];
      }

      // Extract group / category
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      if (groupMatch && groupMatch[1]) {
        current.category = groupMatch[1];
        current.groupTitle = groupMatch[1];
      }

      // Extract tvg-name or channel display name after comma
      const parts = line.split(',');
      if (parts.length > 1) {
        const namePart = parts.slice(1).join(',').trim();
        if (namePart) {
          current.name = namePart;
        }
      }
      continue;
    }

    if (current && line && !line.startsWith('#')) {
      if (line.startsWith('http://') || line.startsWith('https://')) {
        current.url = line;
        current.servers = [{ name: 'Server 1', url: line }];
        channels.push(current as Channel);
      }
      current = null;
    }
  }

  // Fallback if no EXTINF tags were present but plain URLs exist
  if (channels.length === 0) {
    const urlLines = lines.filter(
      (l) => l.trim() && !l.startsWith('#') && (l.includes('http://') || l.includes('https://'))
    );
    urlLines.forEach((u, idx) => {
      channels.push({
        id: `direct-${idx + 1}`,
        name: `Stream Channel ${idx + 1}`,
        logo: DEFAULT_LOGO,
        url: u,
        category: 'Live TV',
        servers: [{ name: 'Server 1', url: u }]
      });
    });
  }

  return channels;
}
