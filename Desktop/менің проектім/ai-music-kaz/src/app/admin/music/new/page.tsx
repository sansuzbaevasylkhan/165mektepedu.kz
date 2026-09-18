import React from 'react'
import MusicForm from '@/components/admin/MusicForm'
import { motion } from 'framer-motion'

export default function NewMusicPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">Жаңа музыка қосу</h1>
        <p className="text-silver opacity-60">Платформаға жаңа шығарма қосыңыз</p>
      </div>
      <MusicForm onSuccess={() => window.location.href = '/admin'} />
    </motion.div>
  )
}
