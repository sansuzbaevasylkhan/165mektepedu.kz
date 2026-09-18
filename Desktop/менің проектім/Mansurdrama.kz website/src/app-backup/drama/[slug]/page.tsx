import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DramaPlayer } from "@/components/DramaPlayer";
import { DramaCard } from "@/components/DramaCard";
import { Drama } from "@/types";
import { Calendar, Eye, Film, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DramaSection } from "@/components/DramaSection";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ep?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const drama = await prisma.drama.findUnique({ where: { slug } });
  if (!drama) return {};
  return {
    title: drama.title,
    description: drama.description || `${drama.title} - ${drama.totalEpisodes} бөлім`,
    openGraph: {
      title: drama.title,
      description: drama.description || "",
      images: drama.posterUrl ? [{ url: drama.posterUrl }] : [],
    },
  };
}

export const revalidate = 60;

async function getDrama(slug: string) {
  return prisma.drama.findUnique({
    where: { slug },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
      },
    },
  });
}

async function getRelatedDramas(currentId: string) {
  return prisma.drama.findMany({
    where: {
      isPublished: true,
      NOT: { id: currentId },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { episodes: true } } },
  });
}

export default async function DramaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { ep } = await searchParams;
  const drama = await getDrama(slug);

  if (!drama) notFound();

  // View counter: Prisma (негізгі дерекқор) + Firebase RTDB (real-time қабат)
  // Бір сәтте қатар жазамыз — біреуі сәтсіз болса да, деректер сақталады.
  await Promise.allSettled([
    prisma.drama
      .update({
        where: { id: drama.id },
        data: { views: { increment: 1 } },
      })
      .catch(() => {}),
    import("@/lib/firebase-helpers").then((m) => m.incrementDramaView(drama.id)),
  ]);

  const initialEp = ep ? parseInt(ep, 10) : 1;
  const related = await getRelatedDramas(drama.id);

  const relatedDramas: Drama[] = related.map((d) => ({
    id: d.id,
    title: d.title,
    slug: d.slug,
    description: d.description,
    posterUrl: d.posterUrl,
    totalEpisodes: d._count.episodes,
    views: d.views,
    rating: d.rating,
    isPublished: d.isPublished,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Артқа
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main player section */}
            <div className="lg:col-span-2 space-y-6">
              <DramaPlayer
                drama={{
                  id: drama.id,
                  title: drama.title,
                  posterUrl: drama.posterUrl,
                  description: drama.description,
                }}
                episodes={drama.episodes.map((e) => ({
                  id: e.id,
                  episodeNumber: e.episodeNumber,
                  title: e.title,
                  videoUrl: e.videoUrl,
                  duration: e.duration,
                }))}
                initialEpisode={initialEp}
              />

              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                  {drama.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Film className="h-4 w-4" />
                    {drama.episodes.length} бөлім
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {drama.views.toLocaleString()} көрілім
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    {drama.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(drama.createdAt).toLocaleDateString("kk-KZ")}
                  </div>
                </div>
                {drama.description && (
                  <p className="text-white/70 text-sm md:text-base leading-relaxed text-pretty">
                    {drama.description}
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar - episode list */}
            <div>
              <div className="sticky top-24 card p-4 md:p-5 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar">
                <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary-400" />
                  Бөлімдер
                </h2>
                <div className="space-y-2">
                  {drama.episodes.length === 0 ? (
                    <p className="text-sm text-white/50 text-center py-6">Бөлімдер әлі жоқ</p>
                  ) : (
                    drama.episodes.map((e) => (
                      <Link
                        key={e.id}
                        href={`/drama/${drama.slug}?ep=${e.episodeNumber}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary-500/40 transition-all group"
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-pink-500/20 flex items-center justify-center text-sm font-bold text-white border border-white/10">
                          {e.episodeNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                            {e.title}
                          </p>
                          {e.duration > 0 && (
                            <p className="text-xs text-white/50">
                              {Math.floor(e.duration / 60)}:{(e.duration % 60).toString().padStart(2, "0")}
                            </p>
                          )}
                        </div>
                        <div className="h-8 w-8 rounded-full bg-primary-500/0 group-hover:bg-primary-500/20 flex items-center justify-center transition-all">
                          <svg className="h-3 w-3 text-white fill-white" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {relatedDramas.length > 0 && (
            <div className="mt-12">
              <DramaSection
                title="🎬 Ұқсас дорамалар"
                dramas={relatedDramas}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
