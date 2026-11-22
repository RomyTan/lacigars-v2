import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serializeProduct(p: {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  image: string | null;
  brand: string | null;
  origin: string | null;
  shape: string | null;
  boxInfo: string | null;
  quickBooksPrice: unknown;
  wholesalePrice: unknown;
  qboQtyOnHand: unknown;
  isActive: boolean;
  publicVisibilityOverride: boolean | null;
  categoryId: number;
  category?: { id: number; name: string; isPublic: boolean };
}) {
  return {
    ...p,
    quickBooksPrice: Number(p.quickBooksPrice ?? 0),
    wholesalePrice:
      p.wholesalePrice !== null && p.wholesalePrice !== undefined
        ? Number(p.wholesalePrice)
        : null,
    qboQtyOnHand: Number(p.qboQtyOnHand ?? 0),
  };
}

export async function GET() {
  try {
    const auth = await requireAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const products = await prisma.product.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        category: {
          select: { id: true, name: true, isPublic: true },
        },
      },
    });

    return NextResponse.json({
      products: products.map(serializeProduct),
    });
  } catch (error) {
    console.error("GET /api/cms/products error:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
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
    const body = await request.json();
    const {
      sku,
      name,
      categoryId,
      brand,
      description,
      image,
      origin,
      shape,
      boxInfo,
      quickBooksPrice = 0,
      wholesalePrice,
      isActive = true,
      publicVisibilityOverride = true,
    } = body;

    if (!sku?.trim() || !name?.trim() || !categoryId) {
      return NextResponse.json(
        { error: "SKU, product name, and category are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        categoryId: Number(categoryId),
        brand: brand?.trim() || null,
        description: description?.trim() || null,
        image: image?.trim() || null,
        origin: origin?.trim() || null,
        shape: shape?.trim() || null,
        boxInfo: boxInfo?.trim() || null,
        quickBooksPrice: Number(quickBooksPrice) || 0,
        wholesalePrice:
          wholesalePrice !== "" &&
          wholesalePrice !== null &&
          wholesalePrice !== undefined
            ? Number(wholesalePrice)
            : null,
        isActive: Boolean(isActive),
        publicVisibilityOverride:
          publicVisibilityOverride === null
            ? null
            : Boolean(publicVisibilityOverride),
      },
      include: {
        category: { select: { id: true, name: true, isPublic: true } },
      },
    });

    return NextResponse.json(
      { product: serializeProduct(product) },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cms/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product. Ensure SKU is unique." },
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
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product id is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        ...(body.sku !== undefined
          ? { sku: String(body.sku).trim().toUpperCase() }
          : {}),
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.categoryId !== undefined
          ? { categoryId: Number(body.categoryId) }
          : {}),
        ...(body.brand !== undefined
          ? { brand: body.brand ? String(body.brand).trim() : null }
          : {}),
        ...(body.description !== undefined
          ? {
              description: body.description
                ? String(body.description).trim()
                : null,
            }
          : {}),
        ...(body.image !== undefined
          ? { image: body.image ? String(body.image) : null }
          : {}),
        ...(body.origin !== undefined
          ? { origin: body.origin ? String(body.origin).trim() : null }
          : {}),
        ...(body.shape !== undefined
          ? { shape: body.shape ? String(body.shape).trim() : null }
          : {}),
        ...(body.boxInfo !== undefined
          ? { boxInfo: body.boxInfo ? String(body.boxInfo).trim() : null }
          : {}),
        ...(body.quickBooksPrice !== undefined
          ? { quickBooksPrice: Number(body.quickBooksPrice) || 0 }
          : {}),
        ...(body.wholesalePrice !== undefined
          ? {
              wholesalePrice:
                body.wholesalePrice === "" || body.wholesalePrice === null
                  ? null
                  : Number(body.wholesalePrice),
            }
          : {}),
        ...(body.isActive !== undefined
          ? { isActive: Boolean(body.isActive) }
          : {}),
        ...(body.publicVisibilityOverride !== undefined
          ? {
              publicVisibilityOverride:
                body.publicVisibilityOverride === null
                  ? null
                  : Boolean(body.publicVisibilityOverride),
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, isPublic: true } },
      },
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error("PATCH /api/cms/products error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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
        { error: "Product id is required" },
        { status: 400 }
      );
    }

    await prisma.product.delete({ where: { id: Number(id) } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/cms/products error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to delete product. It may be referenced by existing orders.",
      },
      { status: 500 }
    );
  }
}