import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import AdminDashboardClient from "@/components/AdminDashboardClient";

async function ProtectedAdminContent() {
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
        <div className="min-h-screen bg-[#f4f3f0] p-8 text-center text-xs text-[#6b6256]">
          Verifying admin session...
        </div>
      }
    >
      <ProtectedAdminContent />
    </Suspense>
  );
}