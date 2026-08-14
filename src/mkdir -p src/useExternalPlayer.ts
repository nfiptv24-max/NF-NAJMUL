// src/hooks/useExternalPlayer.ts
import { useCallback } from 'react';

interface UseExternalPlayerProps {
  videoUrl: string;
  videoTitle?: string;
}

export const useExternalPlayer = ({ videoUrl, videoTitle = 'Live Stream' }: UseExternalPlayerProps) => {
  
  const openInExternalPlayer = useCallback((target: 'mx' | 'vlc' | 'xp' | 'web' | 'network' | 'any') => {
    if (!videoUrl) {
      console.error('❌ No video URL provided');
      return;
    }

    console.log('🎯 Opening in player:', target, 'URL:', videoUrl);

    // For Web Player - Open in new window with HTML5 video
    if (target === 'web') {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>${videoTitle}</title>
            <style>
              * { margin: 0; padding: 0; }
              body { background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
              video { width: 100%; height: 100%; object-fit: contain; background: #000; }
            </style>
          </head>
          <body>
            <video controls autoplay playsinline>
              <source src="${videoUrl}" type="video/mp4">
              <p>Your browser does not support the video tag.</p>
            </video>
          </body>
        </html>
      `;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return;
    }

    // For Network Stream - Copy to clipboard
    if (target === 'network') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(videoUrl).then(() => {
          alert('✅ Stream URL copied to clipboard!');
        }).catch(() => {
          // Fallback
          prompt('📋 Copy this URL:', videoUrl);
        });
      } else {
        prompt('📋 Copy this URL:', videoUrl);
      }
      return;
    }

    // For Android Apps - Proper Intent handling
    const rawUrl = videoUrl.replace(/^https?:\/\//, '');
    const isHttps = videoUrl.startsWith('https://');
    const scheme = isHttps ? 'https' : 'http';
    const encodedTitle = encodeURIComponent(videoTitle);

    let intentUri = '';

    switch (target) {
      case 'mx':
        // MX Player
        intentUri = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=com.mxtech.videoplayer.ad;S.title=${encodedTitle};end;`;
        break;
      case 'vlc':
        // VLC Player
        intentUri = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=org.videolan.vlc;S.title=${encodedTitle};end;`;
        break;
      case 'xp':
        // XPlayer (formerly XP Player)
        intentUri = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;package=mobi.inshot.videoplayer.allformat;S.title=${encodedTitle};end;`;
        break;
      case 'any':
      default:
        // Any Player - Let Android choose
        intentUri = `intent://${rawUrl}#Intent;scheme=${scheme};type=video/*;S.title=${encodedTitle};end;`;
        break;
    }

    // Try to open with intent
    try {
      const isAndroid = window.navigator && 
                        window.navigator.userAgent && 
                        window.navigator.userAgent.includes('Android');
      
      if (isAndroid) {
        console.log('📱 Opening Android intent:', intentUri);
        window.location.href = intentUri;
        
        // Fallback after 2 seconds if intent fails
        setTimeout(() => {
          if (!document.hidden) {
            console.log('🔄 Intent fallback - opening directly');
            window.open(videoUrl, '_blank');
          }
        }, 2000);
      } else {
        // Non-Android: Open directly in browser
        console.log('🌐 Opening in browser:', videoUrl);
        window.open(videoUrl, '_blank');
      }
    } catch (error) {
      console.error('❌ Failed to open external player:', error);
      // Fallback: try direct URL
      window.open(videoUrl, '_blank');
    }
  }, [videoUrl, videoTitle]);

  return { openInExternalPlayer };
};
