import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin/auth"; // Түзетілген импорт

// GET сұрауы - белгілі бір дораманың эпизодтарын алу
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params; // `await` алынып тасталды
    const episodes = await prisma.episode.findMany({
      where: { dramaId: id },
      orderBy: { episodeNumber: "asc" },
    });
    return NextResponse.json(episodes); // Негізгі массивті қайтару
  } catch (err) {
    console.error("Error fetching episodes:", err); // Қатені толық шығару
    return NextResponse.json(
      { error: "Серверде қате пайда болды" },
      { status: 500 }
    );
  }
}

// POST сұрауы - дорамаға жаңа эпизодтар қосу
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: dramaId } = params;
    const body = await req.json();
    const { episodes } = body;

    if (!Array.isArray(episodes) || episodes.length === 0) {
      return NextResponse.json(
        { success: false, error: "Эпизодтар тізімі бос" },
        { status: 400 }
      );
    }

    // Бұрыннан бар эпизодтарды жаңаларымен қайталамас үшін жою
    await prisma.episode.deleteMany({
      where: {
        dramaId: dramaId,
        episodeNumber: {
          in: episodes.map((e: any) => e.episodeNumber),
        },
      },
    });

    // Жаңа эпизодтарды қосу
    const result = await prisma.drama.update({
      where: { id: dramaId },
      data: {
        episodes: {
          create: episodes.map((e: any) => ({
            episodeNumber: e.episodeNumber,
            title: e.title,
            videoUrl: e.videoUrl,
            duration: e.duration || 0,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, drama: result });
  } catch (err) {
    console.error("Error creating episodes:", err);
    return NextResponse.json(
      { success: false, error: "Эпизодтарды сақтау кезінде қате" },
      { status: 500 }
    );
  }
}
