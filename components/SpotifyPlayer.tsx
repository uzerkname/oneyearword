"use client";

interface SpotifyPlayerProps {
  episodeId: string;
  title?: string;
}

export default function SpotifyPlayer({ episodeId, title }: SpotifyPlayerProps) {
  return (
    <div className="w-full h-full bg-leather-video flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-2xl">
        {title && (
          <p className="text-leather-body/70 text-sm font-sans mb-3 text-center line-clamp-1">
            {title}
          </p>
        )}
        <iframe
          src={`https://open.spotify.com/embed/episode/${episodeId}?theme=0`}
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
          title="Spotify podcast player"
        />
      </div>
    </div>
  );
}
