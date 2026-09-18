"use client"
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Music, Eye, Play, Download, Users, Plus } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMusic: 0,
    totalViews: 0,
    totalPlays: 0,
    totalDownloads: 0,
    onlineListeners: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase.from('music').select('*')
        if (error) throw error

        const totalMusic = data.length
        const totalViews = data.reduce((acc: number, item: any) => acc + (item.views || 0), 0)
        const totalPlays = data.reduce((acc: number, item: any) => acc + (item.plays || 0), 0)
        const totalDownloads = data.reduce((acc: number, item: any) => acc + (item.downloads || 0), 0)
        const onlineListeners = data.reduce((acc: number, item: any) => acc + (item.online_listeners || 0), 0)

        setStats({
          totalMusic,
          totalViews,
          totalPlays,
          totalDownloads,
          onlineListeners,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-luxury-purple"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Барлық музыка', value: stats.totalMusic, icon: Music, color: 'text-luxury-purple' },
    { label: 'Барлық көрілім', value: stats.totalViews, icon: Eye, color: 'text-blue-400' },
    { label: 'Барлық тыңдау', value: stats.totalPlays, icon: Play, color: 'text-green-400' },
    { label: 'Барлық жүктеу', value: stats.totalDownloads, icon: Download, color: 'text-yellow-400' },
    { label: 'Қазір онлайн', value: stats.onlineListeners, icon: Users, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold text-gradient"
          >
            AI Music KAZ
          </motion.h1>
          <p className="text-silver opacity-60">Басқару панеліне қош келдіңіз</p>
        </div>

        <Link
          href="/admin/music/new"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-luxury-purple to-luxury-blue text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-luxury-purple/20"
        >
          <Plus className="w-5 h-5" />
          Жаңа музыка қосу
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 glassmorphism rounded-3xl border border-glass-border"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl bg-graphite ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-silver opacity-60 font-medium">{card.label}</span>
            </div>
            <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
