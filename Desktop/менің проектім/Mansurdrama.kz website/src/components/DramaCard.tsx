"use client";

import { motion } from "framer-motion";
import { Play, Film } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DramaCardProps {
  id: string;
  slug: string;
  title: string;
  posterUrl: string;
  totalEpisodes: number;
  index?: number;
  priority?: boolean;
  className?: string;
}

export function DramaCard({
  id,
  slug,
  title,
  posterUrl,
  totalEpisodes,
  index = 0,
  priority = false,
  className,
}: DramaCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
      className={cn("group", className)}
    >
      <Link href={`/drama/${slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-dark-800 ring-1 ring-white/5 group-hover:ring-primary-500/40 transition-all duration-500">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
              <Film className="h-12 w-12 text-white/30" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

          {/* Episode badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur text-[10px] font-semibold text-white">
            <Film className="h-3 w-3" />
            {totalEpisodes} бөлім
          </div>

          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary-500/90 backdrop-blur flex items-center justify-center shadow-2xl shadow-primary-500/50 transform group-hover:scale-100 scale-50 transition-transform duration-300">
              <Play className="h-5 w-5 md:h-6 md:w-6 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        <div className="mt-2 px-1">
          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
