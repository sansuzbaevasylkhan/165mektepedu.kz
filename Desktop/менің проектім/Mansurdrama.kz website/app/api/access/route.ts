import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hasEpisodeAccess } from '@/lib/access';

const querySchema = z.object({
  email: z.string().email(),
  dramaId: z.string().min(1),
  episodeNumber: z.coerce.number().int().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = querySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Жарамсыз сұраныс', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, dramaId, episodeNumber } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Anonymous user => only 1-10 free; for 11+ return false.
    if (!user) {
      const allowed = episodeNumber <= 10;
      return NextResponse.json({ allowed, userExists: false });
    }

    const allowed = await hasEpisodeAccess(user.id, dramaId, episodeNumber);
    return NextResponse.json({ allowed, userExists: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

