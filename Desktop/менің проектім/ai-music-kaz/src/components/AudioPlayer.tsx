import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AudioPlayerProps {
  src: string
  title: string
  onPlay?: () => void
}

export default function AudioPlayer({ src, title, onPlay }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      if (onPlay) onPlay()
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [onPlay])

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseInt(e.target.value) / 100) * (audioRef.current?.duration || 0)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
    setProgress(parseInt(e.target.value))
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <div className="w-full glassmorphism p-6 rounded-3xl border border-glass-border shadow-2xl">
      <audio ref={audioRef} src={src} />

      <div className="flex flex-col gap-6">
        {/* Title & Meta */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gradient">{title}</h3>
          <p className="text-silver opacity-40 text-sm">AI MUSIC KAZ Premium Player</p>
        </div>

        {/* Visualizer Mock (Animated Bars) */}
        <div className="flex items-end justify-center gap-1 h-16">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: isPlaying ? [10, Math.random() * 60 + 10, 10] : 5,
              }}
              transition={{
                duration: 0.5 + Math.random(),
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-1 bg-gradient-to-t from-luxury-purple to-luxury-blue rounded-full"
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="relative group">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-1.5 bg-graphite rounded-full appearance-none cursor-pointer accent-luxury-purple"
            />
            <div
              className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-luxury-purple to-luxury-blue rounded-full pointer-events-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-silver opacity-60 font-mono">
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
            <span>{formatTime(audioRef.current?.duration || 0)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-silver hover:text-white transition-colors opacity-60">
              <Shuffle className="w-5 h-5" />
            </button>
            <button className="text-silver hover:text-white transition-colors">
              <SkipBack className="w-6 h-6" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-luxury-purple to-luxury-blue text-white rounded-full shadow-lg shadow-luxury-purple/40"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </motion.button>

          <div className="flex items-center gap-4">
            <button className="text-silver hover:text-white transition-colors">
              <SkipForward className="w-6 h-6" />
            </button>
            <button className="text-silver hover:text-white transition-colors opacity-60">
              <Repeat className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 px-4 py-2 bg-graphite/50 rounded-full w-fit mx-auto border border-glass-border">
          <button onClick={toggleMute} className="text-silver hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-graphite rounded-full appearance-none cursor-pointer accent-silver"
          />
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
