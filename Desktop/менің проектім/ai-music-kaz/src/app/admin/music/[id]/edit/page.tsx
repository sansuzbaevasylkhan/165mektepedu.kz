"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MusicForm from '@/components/admin/MusicForm'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function EditMusicPage({ params }: { params: { id: string } }) {
  const [music, setMusic] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchMusic() {
      try {
        const { data, error } = await supabase
          .from('music')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setMusic(data)
      } catch (error: any) {
        toast.error('Музыканы жүктеу мүмкін болмады')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMusic()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-luxury-purple"></div>
      </div>
    )
  }

  if (!music) {
    return <div className="text-center text-silver">Музыка табылмады</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">Музыканы өзгерту</h1>
        <p className="text-silver opacity-60">{music.title} шығармасын редакциялау</p>
      </div>
      <MusicForm
        initialData={music}
        isEditing
        onSuccess={() => {
          router.push('/admin')
          router.refresh()
        }}
      />
    </motion.div>
  )
}
