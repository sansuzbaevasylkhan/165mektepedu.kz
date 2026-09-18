"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Film, Sparkles } from "lucide-react";
import { Drama } from "@/types";

interface HeroProps {
  drama: Drama;
}

export function Hero({ drama }: HeroProps) {
  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        {drama.posterUrl ? (
          <Image
            src={drama.posterUrl}
            alt={drama.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20" />
        )}
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Animated floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/3 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl animate-pulse-slow" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-6 h-full flex flex-col justify-end pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Қазір танымал
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-4"
          >
            {drama.title}
          </motion.h1>

          {drama.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-base text-white/80 line-clamp-3 md:line-clamp-4 mb-6 max-w-xl text-pretty"
            >
              {drama.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 text-sm text-white/70 mb-6"
          >
            <div className="flex items-center gap-1.5">
              <Film className="h-4 w-4" />
              <span>{drama.totalEpisodes} бөлім</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span>{drama.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{drama.views.toLocaleString()} көрілім</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href={`/drama/${drama.slug}`}
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="h-5 w-5 fill-white" />
              Қарау
            </Link>
            <Link
              href={`/drama/${drama.slug}`}
              className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-xl font-semibold text-sm md:text-base bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 transition-all"
            >
              <Info className="h-5 w-5" />
              Толығырақ
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
