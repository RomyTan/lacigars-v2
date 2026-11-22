import { Suspense } from "react";
import { getLiveCatalog } from "@/lib/cms-server";
import { ProductsCatalogClient } from "@/components/ProductsCatalogClient";

async function LiveProductsContent() {
  const products = await getLiveCatalog();
  return <ProductsCatalogClient products={products} />;
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfbf7] pt-32 text-center text-xs text-[#6b6256]">
          Loading wholesale catalog...
        </div>
      }
    >
      <LiveProductsContent />
    </Suspense>
  );
}