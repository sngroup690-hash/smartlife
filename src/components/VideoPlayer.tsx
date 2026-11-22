"use client";

import { Play, ExternalLink } from "lucide-react";

function toVideoEmbed(url: string): { type: "iframe" | "video"; src: string; youtubeUrl?: string } | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return { type: "iframe", src: `https://www.youtube.com/embed/${id}?rel=0`, youtubeUrl: `https://www.youtube.com/watch?v=${id}` };
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v ? { type: "iframe", src: `https://www.youtube.com/embed/${v}?rel=0`, youtubeUrl: `https://www.youtube.com/watch?v=${v}` } : null;
      }
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.split("/embed/")[1]?.split("?")[0];
        return { type: "iframe", src: url, youtubeUrl: id ? `https://www.youtube.com/watch?v=${id}` : undefined };
      }
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/shorts/")[1];
        return id ? { type: "iframe", src: `https://www.youtube.com/embed/${id}?rel=0`, youtubeUrl: `https://www.youtube.com/shorts/${id}` } : null;
      }
    }
    // Vimeo
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
    // Google Drive
    const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (drive) return { type: "iframe", src: `https://drive.google.com/file/d/${drive[1]}/preview` };
    // Direct video file
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return { type: "video", src: url };
    return null;
  } catch { return null; }
}

interface VideoPlayerProps {
  url?: string;
  className?: string;
  title?: string;
  showExternalLink?: boolean;
}

export default function VideoPlayer({ url, className = "", title, showExternalLink = true }: VideoPlayerProps) {
  if (!url?.trim()) return null;

  const embed = toVideoEmbed(url);
  if (!embed) return null;

  return (
    <div className={`rounded-2xl overflow-hidden bg-black ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Play size={14} className="text-[#E8B800]" />
          <span className="text-white text-sm font-semibold">{title || "Vidéo de présentation"}</span>
        </div>
        {showExternalLink && embed.youtubeUrl && (
          <a
            href={embed.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <ExternalLink size={11} />
            YouTube
          </a>
        )}
      </div>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {embed.type === "iframe" ? (
          <iframe
            src={embed.src}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <video
            src={embed.src}
            className="absolute inset-0 w-full h-full"
            controls
            preload="metadata"
          />
        )}
      </div>
    </div>
  );
}
