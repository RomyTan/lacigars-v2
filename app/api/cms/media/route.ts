import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const media = await prisma.cmsMedia.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ media });
  } catch (error) {
    console.error("GET /api/cms/media error:", error);
    return NextResponse.json(
      { error: "Failed to load media library" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { fileName, mimeType, sizeByte, url } = await request.json();

    if (!fileName || !url || typeof url !== "string") {
      return NextResponse.json(
        { error: "fileName and url are required" },
        { status: 400 }
      );
    }

    // Limit ~3.5MB base64 payload to keep MySQL / serverless body safe
    if (url.length > 4_800_000) {
      return NextResponse.json(
        { error: "Image file is too large. Please use an image under 3MB." },
        { status: 400 }
      );
    }

    const item = await prisma.cmsMedia.create({
      data: {
        fileName: String(fileName).trim(),
        mimeType: String(mimeType || "image/jpeg").trim(),
        sizeByte: Number(sizeByte) || url.length,
        url,
      },
    });

    return NextResponse.json({ media: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cms/media error:", error);
    return NextResponse.json(
      { error: "Failed to save media to database" },
      { status: 500 }
    );
  }
}