import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Upload, FileMusic, Image as ImageIcon, Loader2 } from 'lucide-react'

interface MusicFormProps {
  initialData?: any
  onSuccess?: () => void
  isEditing?: boolean
}

export default function MusicForm({ initialData, onSuccess, isEditing }: MusicFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [text, setText] = useState(initialData?.text || '')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploads, setUploads] = useState({ cover: false, audio: false })

  async function handleUpload(file: File, folder: 'music-covers' | 'music-audio') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(folder).getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      let coverUrl = initialData?.cover_url
      let audioUrl = initialData?.audio_url

      if (coverFile) {
        setUploads(prev => ({ ...prev, cover: true }))
        coverUrl = await handleUpload(coverFile, 'music-covers')
      }

      if (audioFile) {
        setUploads(prev => ({ ...prev, audio: true }))
        audioUrl = await handleUpload(audioFile, 'music-audio')
      }

      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')

      const musicData = {
        title,
        text,
        cover_url: coverUrl,
        audio_url: audioUrl,
        slug,
        is_edited: isEditing,
        updated_at: new Date().toISOString(),
      }

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('music')
          .update(musicData)
          .eq('id', initialData.id)
        if (error) throw error
        toast.success('Музыка сәтті өзгертілді!')
      } else {
        const { error } = await supabase.from('music').insert([musicData])
        if (error) throw error
        toast.success('Музыка сәтті қосылды!')
      }

      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Қате пайда болды')
    } finally {
      setIsLoading(false)
      setUploads({ cover: false, audio: false })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-silver opacity-60 text-sm font-medium">Аты</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-graphite border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-purple/50 transition-all text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Музыка атауы..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-silver opacity-60 text-sm font-medium">Обложка жүктеу</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="cover-upload"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="cover-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-graphite border border-dashed border-glass-border rounded-xl cursor-pointer hover:border-luxury-purple transition-all text-silver group-hover:text-white"
              >
                {uploads.cover ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                {coverFile ? coverFile.name : 'Сурет таңдау'}
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-silver opacity-60 text-sm font-medium">Аудио жүктеу</label>
          <div className="relative group">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              id="audio-upload"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="audio-upload"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-graphite border border-dashed border-glass-border rounded-xl cursor-pointer hover:border-luxury-blue transition-all text-silver group-hover:text-white"
            >
              {uploads.audio ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileMusic className="w-5 h-5" />}
              {audioFile ? audioFile.name : 'Аудио таңдау'}
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-silver opacity-60 text-sm font-medium">Текст</label>
          <textarea
            className="w-full px-4 py-3 bg-graphite border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-luxury-purple/50 transition-all text-white h-40 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ән мәтінін енгізіңіз..."
          />
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 rounded-xl text-silver hover:text-white transition-all"
        >
          Болдырмау
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-luxury-purple to-luxury-blue text-white font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          Сақтау
        </button>
      </div>
    </form>
  )
}
