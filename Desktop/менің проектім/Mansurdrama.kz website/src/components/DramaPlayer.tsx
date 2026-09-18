"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack } from "lucide-react";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration: number;
}

interface DramaPlayerProps {
  drama: {
    id: string;
    title: string;
    posterUrl: string;
    description?: string | null;
  };
  episodes: Episode[];
  initialEpisode?: number;
}

export function DramaPlayer({ drama, episodes, initialEpisode = 1 }: DramaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentEp, setCurrentEp] = useState(
    episodes.find((e) => e.episodeNumber === initialEpisode) || episodes[0]
  );
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Auto-play next episode
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => {
      const currentIndex = episodes.findIndex((e) => e.id === currentEp?.id);
      const next = episodes[currentIndex + 1];
      if (next) {
        setCurrentEp(next);
        setTimeout(() => video.play(), 100);
      }
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [currentEp, episodes]);

  // Hide controls after inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const reset = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (playing) setShowControls(false);
      }, 3000);
    };
    reset();
    window.addEventListener("mousemove", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
    };
  }, [playing]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(!muted);
    }
  };

  const fullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const seek = (pct: number) => {
    if (videoRef.current && duration) {
      videoRef.current.currentTime = (pct / 100) * duration;
    }
  };

  const playNext = () => {
    const currentIndex = episodes.findIndex((e) => e.id === currentEp?.id);
    const next = episodes[currentIndex + 1];
    if (next) setCurrentEp(next);
  };

  const playPrev = () => {
    const currentIndex = episodes.findIndex((e) => e.id === currentEp?.id);
    const prev = episodes[currentIndex - 1];
    if (prev) setCurrentEp(prev);
  };

  const onTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!currentEp) {
    return (
      <div className="aspect-video bg-dark-900 rounded-2xl flex items-center justify-center text-white/50">
        Бөлімдер табылмады
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group"
      onMouseMove={() => setShowControls(true)}
    >
      <video
        key={currentEp.id}
        ref={videoRef}
        src={currentEp.videoUrl}
        poster={drama.posterUrl}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onClick={togglePlay}
      />

      {/* Center play button when paused */}
      <AnimatePresence>
        {!playing && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <div className="h-20 w-20 rounded-full bg-primary-500/90 backdrop-blur flex items-center justify-center shadow-2xl shadow-primary-500/50 hover:scale-110 transition-transform">
              <Play className="h-10 w-10 text-white fill-white ml-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top overlay - title */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent"
          >
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded-md bg-primary-500/90 text-xs font-bold text-white">
                EP {currentEp.episodeNumber}
              </div>
              <p className="text-white font-semibold text-sm md:text-base line-clamp-1">
                {currentEp.title}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
          >
            {/* Progress bar */}
            <div
              className="group/progress relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 hover:h-2 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                seek(pct);
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-primary-500 rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity"
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: "translate(-50%, -50%)" }}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors"
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                </button>
                <button
                  onClick={playPrev}
                  disabled={episodes.findIndex((e) => e.id === currentEp.id) === 0}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
                <button
                  onClick={playNext}
                  disabled={episodes.findIndex((e) => e.id === currentEp.id) === episodes.length - 1}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleMute}
                  className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <span className="text-xs text-white/80 ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <button
                onClick={fullscreen}
                className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
