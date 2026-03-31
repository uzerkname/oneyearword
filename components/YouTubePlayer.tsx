"use client";

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
}

export default function YouTubePlayer({ videoId, title }: YouTubePlayerProps) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="w-full h-full bg-leather-video flex items-center justify-center p-6 lg:p-12">
      <div className="flex flex-col items-center gap-6 max-w-lg w-full">
        {/* Thumbnail */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-video rounded-lg overflow-hidden group shadow-2xl"
        >
          <img
            src={thumbnailUrl}
            alt={title || "Bible in a Year"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-leather-accent/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <svg
                className="w-7 h-7 lg:w-9 lg:h-9 text-leather-bg ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>

        {/* Title */}
        {title && (
          <p className="text-leather-body/80 text-sm font-sans text-center line-clamp-2">
            {title}
          </p>
        )}

        {/* Watch button */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-leather-accent text-leather-bg font-sans font-semibold px-6 py-3 rounded-lg hover:bg-leather-accent/90 transition-colors shadow-md"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418A2.506 2.506 0 0 0 2.418 6.186C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z" />
          </svg>
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}
