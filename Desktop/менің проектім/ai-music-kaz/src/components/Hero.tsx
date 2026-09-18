import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-luxury-purple/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-luxury-blue/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl md:text-8xl font-extrabold text-gradient mb-6 tracking-tighter"
        >
          AI MUSIC KAZ
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl md:text-3xl text-silver opacity-80 mb-8 font-light italic"
        >
          Қазақ музыкасының жаңа кеңістігі
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <Link
            href="#music"
            className="px-10 py-4 bg-gradient-to-r from-luxury-purple to-luxury-blue text-white font-bold rounded-full hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-luxury-purple/30 text-lg"
          >
            Музыкаларды тыңдау
          </Link>
          <p className="text-silver opacity-50 text-sm">
            Музыканы онлайн тыңдаңыз немесе жүктеп алыңыз.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
