"use client"
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import AudioPlayer from '@/components/AudioPlayer'
import { Download, Eye, Play, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function MusicDetailPage({ params }: { params: { slug: string } }) {
  const [music, setMusic] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMusic() {
      try {
        const { data, error } = await supabase
          .from('music')
          .select('*')
          .eq('slug', params.slug)
          .single()

        if (error) throw error
        setMusic(data)

        // Increment view count
        await supabase.rpc('increment_view', { music_id: data.id })
      } catch (error) {
        console.error('Error fetching music:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMusic()
  }, [params.slug])

  async function handleDownload() {
    try {
      // Increment download count
      const { error } = await supabase.rpc('increment_download', { music_id: music.id })
      if (error) throw error

      toast.info('Музыка жүктелуде...')

      // Trigger actual download
      const link = document.createElement('a')
      link.href = music.audio_url
      link.download = `${music.title}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('✓ Музыка сәтті жүктелді!')
    } catch (error: any) {
      toast.error('Жүктеу кезінде қате орын алды')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-luxury-purple"></div>
      </div>
    )
  }

  if (!music) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-silver text-center p-4">
        <div>
          <h1 className="text-4xl font-bold mb-4">Музыка табылмады</h1>
          <Link href="/" className="text-luxury-purple hover:underline">Басты бетке қайту</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Navigation */}
      <div className="p-6 max-w-7xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 text-silver hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Кері қайту
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Visuals */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-luxury-purple to-luxury-blue rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <img
            src={music.cover_url}
            alt={music.title}
            className="relative w-full aspect-square object-cover rounded-[2rem] shadow-2xl border border-glass-border"
          />
          {music.is_edited && (
            <div className="absolute top-6 right-6 bg-luxury-purple text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
              Өзгертілді
            </div>
          )}
        </motion.div>

        {/* Right Column: Info & Player */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gradient leading-tight">
              {music.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-silver opacity-60 font-medium">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>Көрілім: {music.views?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                <span>Тыңдау: {music.plays?.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                <span>Жүктеу: {music.downloads?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <AudioPlayer
            src={music.audio_url}
            title={music.title}
            onPlay={() => {
              // Increment play count via RPC
              supabase.rpc('increment_play', { music_id: music.id })
            }}
          />

          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-silver">Текст</h3>
            <div className="p-6 bg-graphite/50 rounded-3xl border border-glass-border text-silver opacity-80 leading-relaxed whitespace-pre-wrap font-light text-lg">
              {music.text || 'Мәтін қолжетімді емес'}
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full py-5 bg-gradient-to-r from-luxury-purple to-luxury-blue text-white font-bold rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-xl shadow-xl shadow-luxury-purple/30"
          >
            <Download className="w-6 h-6" />
            Жүктеп алу
          </button>
        </motion.div>
      </div>
    </div>
  )
}
