"use client";

import { DramaCard } from "./DramaCard";
import { DramaCardSkeleton } from "@/components/ui/skeleton";
import { Drama } from "@/types";
import { motion } from "framer-motion";

interface DramaSectionProps {
  title: string;
  subtitle?: string;
  dramas: Drama[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DramaSection({
  title,
  subtitle,
  dramas,
  loading,
  emptyMessage = "Әзірге дорамалар жоқ",
}: DramaSectionProps) {
  return (
    <section className="py-6 md:py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between gap-4 mb-4 md:mb-6"
      >
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && (
            <p className="text-sm text-white/50 mt-1">{subtitle}</p>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <DramaCardSkeleton key={i} />
          ))}
        </div>
      ) : dramas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white/5 border border-dashed border-white/10">
          <p className="text-white/40 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {dramas.map((drama, i) => (
            <DramaCard
              key={drama.id}
              id={drama.id}
              slug={drama.slug}
              title={drama.title}
              posterUrl={drama.posterUrl}
              totalEpisodes={drama.totalEpisodes}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  );
}
