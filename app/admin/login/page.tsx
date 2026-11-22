"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/cms/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Sign in failed.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setErrorMsg("Network error while signing in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-100 min-h-screen bg-[#f4f3f0] text-[#1a1714] flex flex-col justify-between p-6">
      <div className="max-w-md w-full mx-auto pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b6256] hover:text-[#1a1714] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Storefront
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-white border border-[#e0dbd0] rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/lacigars-logo.png"
            alt="Latin American Cigars"
            className="h-8 w-auto object-contain"
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8c6d48]">
              LAC Storefront CMS
            </p>
            <h1 className="text-lg font-bold text-[#1a1714]">Admin Sign In</h1>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@latinamericancigars.com"
              className="w-full px-3.5 py-2.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-[#6b6256]">
        Authorized CMS access only.
      </p>
    </div>
  );
}