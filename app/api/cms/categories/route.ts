import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const categories = await prisma.category.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/cms/categories error:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
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
    const { name, fullName, isActive = true, isPublic = true } =
      await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        fullName: fullName?.trim() || name.trim(),
        isActive: Boolean(isActive),
        isPublic: Boolean(isPublic),
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/cms/categories error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
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
    const { id, name, fullName, isActive, isPublic } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Category id is required" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(isPublic !== undefined ? { isPublic: Boolean(isPublic) } : {}),
      },
      include: {
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("PATCH /api/cms/categories error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
        { error: "Category id is required" },
        { status: 400 }
      );
    }

    const productCount = await prisma.product.count({
      where: { categoryId: Number(id) },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category that still has products assigned." },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: Number(id) } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/cms/categories error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}