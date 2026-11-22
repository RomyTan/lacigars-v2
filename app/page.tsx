import { Suspense } from "react";
import { getLiveHomeData } from "@/lib/cms-server";
import { HomeStorefront } from "@/components/HomeStorefront";

async function LiveHomeContent() {
  const { sections, brands } = await getLiveHomeData();
  return <HomeStorefront sections={sections} brands={brands} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfbf7]" />
      }
    >
      <LiveHomeContent />
    </Suspense>
  );
}