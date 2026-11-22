import { Suspense } from "react";
import { getLiveBrands } from "@/lib/cms-server";
import { BrandsGridClient } from "@/components/BrandsGridClient";

async function LiveBrandsContent() {
  const brands = await getLiveBrands();
  return <BrandsGridClient brands={brands} />;
}

export default function BrandsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfbf7] pt-32 text-center text-xs text-[#6b6256]">
          Loading brands...
        </div>
      }
    >
      <LiveBrandsContent />
    </Suspense>
  );
}