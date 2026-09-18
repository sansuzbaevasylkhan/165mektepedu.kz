"use client";
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Hero from '@/components/Hero'
import MusicCard from '@/components/MusicCard'
import { Search } from 'lucide-react'

export default function HomePage() {
  const [musicList, setMusicList] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMusic() {
      try {
        const { data, error } = await supabase
          .from('music')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMusicList(data)
      } catch (error) {
        console.error('Error fetching music:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMusic()
  }, [])

  const filteredMusic = musicList.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <section id="music" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-16 space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-gradient"
          >
            Музыкалар
          </motion.h2>

          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-silver opacity-40 w-6 h-6" />
            <input
              type="text"
              placeholder="Музыка іздеу..."
              className="w-full pl-14 pr-6 py-4 bg-graphite border border-glass-border rounded-full focus:outline-none focus:ring-2 focus:ring-luxury-purple/50 transition-all text-white text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-luxury-purple"></div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredMusic.map((music) => (
              <MusicCard key={music.id} music={music} />
            ))}
          </motion.div>
        )}

        {!isLoading && filteredMusic.length === 0 && (
          <div className="text-center py-20 text-silver opacity-40 text-xl">
            Сәйкес музыка табылмады
          </div>
        )}
      </section>
    </div>
  )
}
