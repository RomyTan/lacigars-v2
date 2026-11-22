import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { INITIAL_BRANDS } from "@/lib/storefront-data";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let brands = await prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (brands.length === 0) {
      await prisma.brand.createMany({
        data: INITIAL_BRANDS.map((b, idx) => ({
          name: b.name,
          slug: slugify(b.name),
          logoUrl: `/brands/${b.img}`,
          sortOrder: idx,
          isActive: true,
        })),
        skipDuplicates: true,
      });
      brands = await prisma.brand.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("GET /api/cms/brands error:", error);
    return NextResponse.json(
      { error: "Failed to load brands" },
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
    const { name, logoUrl, isActive = true } = await request.json();
    if (!name || !logoUrl) {
      return NextResponse.json(
        { error: "Name and logoUrl are required" },
        { status: 400 }
      );
    }

    const count = await prisma.brand.count();
    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug: slugify(name),
        logoUrl: logoUrl.trim(),
        isActive: Boolean(isActive),
        sortOrder: count,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cms/brands error:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id, name, logoUrl, isActive, sortOrder } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Brand id is required" },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined
          ? { name: name.trim(), slug: slugify(name) }
          : {}),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl.trim() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
      },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("PATCH /api/cms/brands error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Brand id is required" },
        { status: 400 }
      );
    }

    await prisma.brand.delete({ where: { id: Number(id) } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/cms/brands error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}