import { prisma } from "../lib/prisma";

async function main() {
  let category = await prisma.category.findFirst({
    where: { name: "Premium Cigars" },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Premium Cigars",
        fullName: "Premium Hand-Rolled Cigars",
        isActive: true,
        isPublic: true,
      },
    });
  }

  await prisma.product.upsert({
    where: { sku: "LAC-001" },
    update: {},
    create: {
      sku: "LAC-001",
      name: "Habana Reserve Churchill",
      description: "Premium hand-rolled cigar.",
      brand: "Latin American Cigars",
      origin: "Nicaragua",
      shape: "Churchill",
      boxInfo: "Box of 20",
      quickBooksPrice: 200.0,
      wholesalePrice: 150.0,
      isActive: true,
      publicVisibilityOverride: true,
      categoryId: category.id,
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });