"use client";

import "@/app/starfield.css";

interface SpotifyPlayerProps {
  episodeId: string;
  title?: string;
}

const SPOTIFY_EPISODE_ID_PATTERN = /^[a-zA-Z0-9]{22}$/;

export default function SpotifyPlayer({ episodeId, title }: SpotifyPlayerProps) {
  if (!SPOTIFY_EPISODE_ID_PATTERN.test(episodeId)) {
    return (
      <div className="w-full h-full bg-leather-video flex items-center justify-center">
        <p className="text-leather-muted font-sans">Invalid episode</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Heavenly starfield background */}
      <div className="starfield-container">
        <div id="stars" />
        <div id="stars2" />
        <div id="stars3" />
      </div>

      {/* Spotify player content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-2xl">
          {title && (
            <p className="text-leather-body/70 text-sm font-sans mb-3 text-center line-clamp-1">
              {title}
            </p>
          )}
          <iframe
            src={`https://open.spotify.com/embed/episode/${encodeURIComponent(episodeId)}?theme=0`}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
            className="rounded-xl"
            title="Spotify podcast player"
          />
        </div>
      </div>
    </div>
  );
}
