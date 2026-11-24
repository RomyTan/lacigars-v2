import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminDashboardClient from "@/components/AdminDashboardClient";

async function ProtectedAdminContent() {
  await connection();
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminDashboardClient adminEmail={session.email} />;
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#f4f3f0] text-xs text-[#6b6256]">
          Loading Admin CMS...
        </div>
      }
    >
      <ProtectedAdminContent />
    </Suspense>
  );
}