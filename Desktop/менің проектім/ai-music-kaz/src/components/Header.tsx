"use client";

import Link from 'next/link';
import { Music, Play, Music2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full glassmorphism border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
            <Music className="w-6 h-6 text-platinum" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-gradient">
            AI MUSIC KAZ
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110"
            title="YouTube"
          >
            <Play className="w-5 h-5 text-platinum" />
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110"
            title="TikTok"
          >
            <Music2 className="w-5 h-5 text-platinum" />
          </a>
          <a
            href="#"
            className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110"
            title="Custom Link"
          >
            <ExternalLink className="w-5 h-5 text-platinum" />
          </a>
        </div>
      </div>
    </header>
  );
}
