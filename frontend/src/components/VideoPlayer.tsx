'use client';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title?: string;
}

export default function VideoPlayer({ videoUrl, thumbnailUrl, title }: VideoPlayerProps) {
  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-lg">
      <video
        controls
        poster={thumbnailUrl}
        className="w-full h-auto"
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Tarayıcınız video oynatmayı desteklemiyor.
      </video>

      {title && (
        <div className="bg-gray-900 text-white p-4">
          <h3 className="font-semibold">{title}</h3>
        </div>
      )}
    </div>
  );
}
