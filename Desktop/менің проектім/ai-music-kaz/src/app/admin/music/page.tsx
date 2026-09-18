import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Edit, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AllMusicPage() {
  const [musicList, setMusicList] = useState<any[]>([])
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
      } catch (error: any) {
        toast.error('Мәліметтерді жүктеу мүмкін болмады')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMusic()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Бұл музыканы өшіруге сенімдісіз бе?')) return

    try {
      const { error } = await supabase.from('music').delete().eq('id', id)
      if (error) throw error
      toast.success('Музыка сәтті өшірілді!')
      setMusicList(musicList.filter(item => item.id !== id))
    } catch (error: any) {
      toast.error(error.message || 'Өшіру кезінде қате орын алды')
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-luxury-purple"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gradient">Барлық музыкалар</h1>
        <Link
          href="/admin/music/new"
          className="px-6 py-3 bg-gradient-to-r from-luxury-purple to-luxury-blue text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95"
        >
          + Жаңа қосу
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-silver opacity-60 text-sm border-b border-glass-border">
              <th className="pb-4 font-medium">Обложка</th>
              <th className="pb-4 font-medium">Аты</th>
              <th className="pb-4 font-medium">Көрілім</th>
              <th className="pb-4 font-medium">Тыңдау</th>
              <th className="pb-4 font-medium">Жүктеу</th>
              <th className="pb-4 font-medium text-right">Әрекеттер</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-glass-border">
            {musicList.map((item) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group hover:bg-glass transition-all"
              >
                <td className="py-4">
                  <img src={item.cover_url} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                </td>
                <td className="py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.title}</span>
                    {item.is_edited && (
                      <span className="text-[10px] bg-luxury-purple text-white px-2 py-0.5 rounded-full w-fit">Өзгертілді</span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-silver">{item.views?.toLocaleString()}</td>
                <td className="py-4 text-silver">{item.plays?.toLocaleString()}</td>
                <td className="py-4 text-silver">{item.downloads?.toLocaleString()}</td>
                <td className="py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/music/${item.id}/edit`}
                      className="p-2 hover:bg-luxury-purple/20 text-silver hover:text-luxury-purple rounded-lg transition-all"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-500/20 text-silver hover:text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {musicList.length === 0 && (
          <div className="text-center py-20 text-silver opacity-40">Музыкалар тізімі бос</div>
        )}
      </div>
    </div>
  )
}
