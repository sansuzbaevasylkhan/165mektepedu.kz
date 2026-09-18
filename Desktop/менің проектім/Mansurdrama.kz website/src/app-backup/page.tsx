import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { DramaSection } from "@/components/DramaSection";
import { Drama } from "@/types";

export const revalidate = 60; // Revalidate every 60 seconds

async function getDramas() {
  try {
    const dramas = await prisma.drama.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { episodes: true } },
      },
    });

    return dramas.map((d) => ({
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
    })) as Drama[];
  } catch (err) {
    console.error("Failed to fetch dramas:", err);
    return [];
  }
}

export default async function HomePage() {
  const dramas = await getDramas();

  // Split into sections
  const featured = dramas[0];
  const trending = dramas.slice(0, 10);
  const latest = dramas.slice(0, 10);
  const all = dramas;

  return (
    <>
      <Header />
      <main className="min-h-screen pb-16">
        {featured && <Hero drama={featured} />}
        <div className="container mx-auto px-4 md:px-6 -mt-10 md:-mt-20 relative z-10">
          {trending.length > 0 && (
            <DramaSection
              title="🔥 Танымал дорамалар"
              subtitle="Қазір ең көп көрілетін туындылар"
              dramas={trending}
            />
          )}
          {latest.length > 0 && (
            <DramaSection
              title="✨ Жаңа қосылғандар"
              subtitle="Соңғы жүктелген дорамалар"
              dramas={latest}
            />
          )}
          {all.length > 10 && (
            <DramaSection
              title="📺 Барлық дорамалар"
              subtitle="Толық каталог"
              dramas={all}
            />
          )}
          {all.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="h-10 w-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2zm0 10V9m0 5a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2v-1a2 2 0 012-2zm10-10V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2zm0 10V9m0 5a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2v-1a2 2 0 012-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Әзірге дорамалар жоқ</h2>
              <p className="text-white/50 max-w-md">
                Админ панель арқылы алғашқы дорамаңызды қосыңыз
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
