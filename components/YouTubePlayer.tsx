"use client";

interface YouTubePlayerProps {
  videoId: string;
}

export default function YouTubePlayer({ videoId }: YouTubePlayerProps) {
  return (
    <div className="w-full h-full bg-leather-video flex items-center justify-center">
      <iframe
        className="w-full h-full lg:rounded-none aspect-video lg:aspect-auto"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Bible in a Year"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
