import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ImportRowInput {
  sku?: string;
  name?: string;
  category?: string;
  brand?: string;
  vendor?: string;
  productType?: string;
  boxInfo?: string;
  origin?: string;
  shape?: string;
  image?: string;
  description?: string;
  wholesalePrice?: number | string | null;
  quickBooksPrice?: number | string | null;
  qboQtyOnHand?: number | string | null;
  isActive?: boolean;
  publicVisibilityOverride?: boolean;
}

function toNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const cleaned = String(val ?? "").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows: ImportRowInput[] = Array.isArray(body.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found in Excel file." },
        { status: 400 }
      );
    }

    const existingCats = await prisma.category.findMany();
    const catMap = new Map<string, number>();
    for (const c of existingCats) {
      catMap.set(c.name.trim().toLowerCase(), c.id);
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row.sku ?? "").trim();
      const name = String(row.name ?? "").trim();
      const catName = String(row.category ?? "").trim() || "Uncategorized";

      if (!sku || !name) {
        skipped++;
        errors.push(`Row ${i + 2}: missing SKU or Product Name.`);
        continue;
      }

      try {
        let categoryId = catMap.get(catName.toLowerCase());
        if (!categoryId) {
          const newCat = await prisma.category.create({
            data: { name: catName, isActive: true, isPublic: true },
          });
          categoryId = newCat.id;
          catMap.set(catName.toLowerCase(), categoryId);
        }

        const existingProduct = await prisma.product.findUnique({
          where: { sku },
        });

        const wholesaleRaw =
          row.wholesalePrice !== undefined &&
          row.wholesalePrice !== null &&
          String(row.wholesalePrice).trim() !== ""
            ? toNumber(row.wholesalePrice, 0)
            : null;

        const payload = {
          name,
          categoryId,
          brand: row.brand ? String(row.brand).trim() : null,
          boxInfo: row.boxInfo ? String(row.boxInfo).trim() : null,
          origin: row.origin ? String(row.origin).trim() : null,
          shape: row.shape ? String(row.shape).trim() : null,
          image: row.image ? String(row.image).trim() : null,
          description: row.description ? String(row.description).trim() : null,
          quickBooksPrice: toNumber(row.quickBooksPrice, 0),
          wholesalePrice: wholesaleRaw,
          qboQtyOnHand: Math.max(0, Math.round(toNumber(row.qboQtyOnHand, 0))),
          isActive: row.isActive !== undefined ? Boolean(row.isActive) : true,
          publicVisibilityOverride:
            row.publicVisibilityOverride !== undefined
              ? Boolean(row.publicVisibilityOverride)
              : true,
        };

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: payload,
          });
          updated++;
        } else {
          await prisma.product.create({
            data: { sku, ...payload },
          });
          created++;
        }
      } catch (rowErr) {
        skipped++;
        errors.push(
          `Row ${i + 2} (${sku}): ${
            rowErr instanceof Error ? rowErr.message : "Failed to save"
          }`
        );
      }
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        include: { category: { select: { id: true, name: true, isPublic: true } } },
        orderBy: { id: "desc" },
      }),
      prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      created,
      updated,
      skipped,
      errors: errors.slice(0, 10),
      products,
      categories,
    });
  } catch (err) {
    console.error("POST /api/cms/products/import error:", err);
    return NextResponse.json(
      { error: "Excel import failed on server." },
      { status: 500 }
    );
  }
}