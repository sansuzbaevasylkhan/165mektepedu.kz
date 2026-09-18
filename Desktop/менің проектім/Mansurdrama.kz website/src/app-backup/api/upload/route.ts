import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/upload";
import { getAdminSession } from "@/lib/auth";

// Increase max body size for video uploads
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Allow uploads only for authenticated admins OR when explicitly enabled
    // (public posters in some flows)
    const isAdmin = await getAdminSession();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subdir = (formData.get("subdir") as string) || "posters";

    if (!file) {
      return NextResponse.json({ error: "Файл табылмады" }, { status: 400 });
    }

    if (!["posters", "videos", "avatars"].includes(subdir)) {
      return NextResponse.json({ error: "Қате папка" }, { status: 400 });
    }

    // Public uploads are restricted; admin-only for safety
    if (!isAdmin && subdir === "videos") {
      return NextResponse.json({ error: "Авторизация қажет" }, { status: 401 });
    }

    const result = await saveUploadedFile(file, subdir as "posters" | "videos" | "avatars");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Жүктеу қатесі" },
      { status: 500 }
    );
  }
}
