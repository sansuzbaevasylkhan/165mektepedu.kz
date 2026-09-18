"use client";

import { Play, Download, Eye, Headphones, ArrowDownCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MusicCardProps {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  views: number;
  plays: number;
  downloads: number;
  is_edited?: boolean;
}

export default function MusicCard({ music }: { music: MusicCardProps }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="group relative bg-graphite rounded-3xl overflow-hidden border border-glass-border hover:border-platinum/30 transition-all duration-500 shadow-2xl"
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={music.cover_url || 'https://via.placeholder.com/400'}
          alt={music.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-platinum text-black rounded-full flex items-center justify-center shadow-xl"
            onClick={() => window.location.href = `/music/${music.slug}`}
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </motion.button>
        </div>

        {/* Edited Badge */}
        {music.is_edited && (
          <div className="absolute top-4 right-4 bg-luxury-purple text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20">
            Өзгертілді
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-platinum mb-4 truncate group-hover:text-white transition-colors">
          {music.title}
        </h3>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Link
              href={`/music/${music.slug}`}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-platinum py-2 px-4 rounded-xl transition-all border border-white/10"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Тыңдау</span>
            </Link>
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-platinum py-2 px-4 rounded-xl transition-all border border-white/10"
              onClick={() => window.location.href = `/music/${music.slug}`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Жүктеу</span>
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-slate-500 text-xs">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{music.views?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              <span>{music.plays?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{music.downloads?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
