import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin/auth"; // Импорт түзетілді
import { ensureUniqueSlug } from "@/lib/slug";

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
    const drama = await prisma.drama.findUnique({
      where: { id },
      include: {
        episodes: { orderBy: { episodeNumber: "asc" } },
      },
    });
    if (!drama) {
      return NextResponse.json({ error: "Дорама табылмады" }, { status: 404 });
    }
    return NextResponse.json(drama); // Тікелей объектіні қайтару
  } catch (err) {
    console.error("Error fetching drama:", err);
    return NextResponse.json(
      { error: "Серверде қате пайда болды" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const body = await req.json();
    const { title, slug, genreIds, ...otherData } = body;

    const dataToUpdate: any = {
      ...otherData,
      title,
    };

    // Slug тек өзгертілген жағдайда ғана жаңартылады
    if (slug) {
      const currentDrama = await prisma.drama.findUnique({ where: { id }, select: { slug: true } });
      if (slug !== currentDrama?.slug) {
        dataToUpdate.slug = await ensureUniqueSlug(slug, async (candidate) => {
          const existing = await prisma.drama.findFirst({ where: { slug: candidate }, select: { id: true } });
          return !!existing;
        });
      }
    }

    const updatedDrama = await prisma.drama.update({
      where: { id },
      data: {
        ...dataToUpdate,
        // Жанрлар байланысын жаңарту
        genres: genreIds
          ? {
              set: genreIds.map((genreId: string) => ({ id: genreId })),
            }
          : undefined,
      },
    });

    return NextResponse.json(updatedDrama);
  } catch (err) {
    console.error("Error updating drama:", err);
    return NextResponse.json(
      { error: "Дораманы жаңарту кезінде қате пайда болды" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await getAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    await prisma.drama.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Дорама сәтті жойылды" });
  } catch (err) {
    console.error("Delete drama error:", err);
    return NextResponse.json(
      { error: "Дораманы жою кезінде қате пайда болды" },
      { status: 500 }
    );
  }
}
