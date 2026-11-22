"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Tag,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type AdminTab = "sections" | "brands";

interface CmsSectionRecord {
  id: number;
  key: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

interface BrandRecord {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("sections");

  // Sections state
  const [sections, setSections] = useState<CmsSectionRecord[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editContentJson, setEditContentJson] = useState("{}");

  // Brands state
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");

  // UI feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, brRes] = await Promise.all([
        fetch("/api/cms/sections"),
        fetch("/api/cms/brands"),
      ]);

      if (!secRes.ok || !brRes.ok) {
        throw new Error("Database API returned an error");
      }

      const secData = await secRes.json();
      const brData = await brRes.json();

      const loadedSections: CmsSectionRecord[] = secData.sections ?? [];
      setSections(loadedSections);
      setBrands(brData.brands ?? []);

      if (loadedSections.length > 0 && selectedSectionId === null) {
        selectSection(loadedSections[0]);
      }
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        "Gagal load data CMS. Pastikan MySQL & prisma db push sudah jalan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSection = (section: CmsSectionRecord) => {
    setSelectedSectionId(section.id);
    setEditTitle(section.title);
    setEditContentJson(JSON.stringify(section.content ?? {}, null, 2));
  };

  const selectedSection =
    sections.find((s) => s.id === selectedSectionId) ?? null;

  const handleToggleSection = async (section: CmsSectionRecord) => {
    try {
      const res = await fetch("/api/cms/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: section.id,
          isActive: !section.isActive,
        }),
      });
      if (!res.ok) throw new Error();
      const { section: updated } = await res.json();
      setSections((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      showToast(
        "success",
        `${updated.title} ${updated.isActive ? "diaktifkan" : "disembunyikan"}.`
      );
    } catch {
      showToast("error", "Gagal update status section.");
    }
  };

  const handleMoveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    const payload = reordered.map((s, idx) => ({ id: s.id, sortOrder: idx }));
    setSections(reordered.map((s, idx) => ({ ...s, sortOrder: idx })));

    try {
      const res = await fetch("/api/cms/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: payload }),
      });
      if (!res.ok) throw new Error();
      showToast("success", "Urutan section tersimpan.");
    } catch {
      showToast("error", "Gagal menyimpan urutan section.");
      loadData();
    }
  };

  const handleSaveSection = async () => {
    if (!selectedSection) return;
    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(editContentJson);
    } catch {
      showToast("error", "Format JSON pada Content tidak valid.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/cms/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSection.id,
          title: editTitle.trim() || selectedSection.title,
          content: parsedContent,
        }),
      });
      if (!res.ok) throw new Error();
      const { section: updated } = await res.json();
      setSections((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      showToast("success", "Perubahan section tersimpan ke database.");
    } catch {
      showToast("error", "Gagal menyimpan perubahan section.");
    } finally {
      setSaving(false);
    }
  };

  // Update simple string fields inside JSON visually
  const parsedEditorObj: Record<string, unknown> | null = (() => {
    try {
      const obj = JSON.parse(editContentJson);
      return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : null;
    } catch {
      return null;
    }
  })();

  const updateSimpleField = (key: string, value: string | boolean) => {
    if (!parsedEditorObj) return;
    const next = { ...parsedEditorObj, [key]: value };
    setEditContentJson(JSON.stringify(next, null, 2));
  };

  // Brands CRUD
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newBrandLogo.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cms/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBrandName.trim(),
          logoUrl: newBrandLogo.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const { brand } = await res.json();
      setBrands((prev) => [...prev, brand]);
      setNewBrandName("");
      setNewBrandLogo("");
      showToast("success", `Brand "${brand.name}" ditambahkan.`);
    } catch {
      showToast("error", "Gagal menambah brand (cek apakah nama duplikat).");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBrand = async (brand: BrandRecord) => {
    try {
      const res = await fetch("/api/cms/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: brand.id, isActive: !brand.isActive }),
      });
      if (!res.ok) throw new Error();
      const { brand: updated } = await res.json();
      setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch {
      showToast("error", "Gagal update status brand.");
    }
  };

  const handleDeleteBrand = async (brand: BrandRecord) => {
    if (!confirm(`Hapus brand "${brand.name}"?`)) return;
    try {
      const res = await fetch(`/api/cms/brands?id=${brand.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
      showToast("success", `Brand "${brand.name}" dihapus.`);
    } catch {
      showToast("error", "Gagal menghapus brand.");
    }
  };

  return (
    <div className="relative z-[100] min-h-screen bg-[#f4f3f0] text-[#1a1714] flex flex-col">
      {/* Shopify-Style Top Bar */}
      <header className="h-14 bg-[#1a1714] text-[#fdfbf7] px-5 flex items-center justify-between border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <img
            src="/lacigars-logo.png"
            alt="LAC Admin"
            className="h-7 w-auto object-contain"
          />
          <span className="text-xs font-bold tracking-[0.18em] uppercase text-[#F8B93C]">
            LAC Storefront CMS
          </span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-white/10 text-[#d8d0c5]">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-[#fdfbf7] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-[11px] font-bold bg-[#F8B93C] hover:bg-[#8c6d48] text-[#1a1714] hover:text-white transition-colors"
          >
            View Live Store
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-bold ${
              toast.type === "success"
                ? "bg-[#1a1714] text-[#F8B93C] border border-[#F8B93C]/40"
                : "bg-red-700 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.text}
          </div>
        </div>
      )}

      {/* Workspace Shell */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Navigation Rail */}
        <aside className="w-full md:w-60 bg-[#ebe8e1] border-b md:border-b-0 md:border-r border-[#dcd7cc] p-4 space-y-1.5">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b6256]">
            Online Store
          </p>
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "sections"
                ? "bg-white text-[#1a1714] shadow-xs"
                : "text-[#4a4238] hover:bg-white/60"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#8c6d48]" />
              Theme Sections
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f3f0] text-[#6b6256]">
              {sections.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("brands")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "brands"
                ? "bg-white text-[#1a1714] shadow-xs"
                : "text-[#4a4238] hover:bg-white/60"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Tag className="w-4 h-4 text-[#8c6d48]" />
              Brands Portfolio
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f3f0] text-[#6b6256]">
              {brands.length}
            </span>
          </button>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#6b6256]">
              Loading CMS data from Prisma...
            </div>
          ) : activeTab === "sections" ? (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Section Order & Visibility List */}
              <div className="lg:col-span-5 bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[#ece8df] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#1a1714]">
                      Homepage Sections
                    </h2>
                    <p className="text-[11px] text-[#6b6256]">
                      Atur urutan &amp; visibilitas section di halaman utama.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#f0ece3]">
                  {sections.map((section, idx) => {
                    const isSelected = section.id === selectedSectionId;
                    return (
                      <div
                        key={section.id}
                        onClick={() => selectSection(section)}
                        className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-[#fdfbf7] border-l-4 border-l-[#8c6d48]"
                            : "hover:bg-[#faf8f4]"
                        }`}
                      >
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              section.isActive
                                ? "text-[#1a1714]"
                                : "text-[#9c9286] line-through"
                            }`}
                          >
                            {section.title}
                          </p>
                          <p className="text-[10px] font-mono text-[#8c6d48] truncate">
                            {section.type}
                          </p>
                        </div>

                        <div
                          className="flex items-center gap-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, -1)}
                            className="p-1.5 rounded hover:bg-[#ebe8e1] disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMoveSection(idx, 1)}
                            className="p-1.5 rounded hover:bg-[#ebe8e1] disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSection(section)}
                            className={`p-1.5 rounded ${
                              section.isActive
                                ? "text-[#1a1714] hover:bg-[#ebe8e1]"
                                : "text-[#9c9286] hover:bg-[#ebe8e1]"
                            }`}
                            title={
                              section.isActive ? "Hide Section" : "Show Section"
                            }
                          >
                            {section.isActive ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Section Content Inspector */}
              <div className="lg:col-span-7 bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                {selectedSection ? (
                  <>
                    <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-mono uppercase text-[#8c6d48]">
                          {selectedSection.key}
                        </p>
                        <h2 className="text-base font-bold text-[#1a1714]">
                          Edit: {selectedSection.title}
                        </h2>
                      </div>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveSection}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>

                    <div className="p-6 space-y-5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1.5">
                          Admin Label
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>

                      {/* Quick Form Fields for top-level string/boolean properties */}
                      {parsedEditorObj && (
                        <div className="space-y-3 pt-2 border-t border-[#f0ece3]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Quick Content Fields
                          </p>
                          {Object.entries(parsedEditorObj).map(([k, v]) => {
                            if (typeof v === "string") {
                              const isLong = v.length > 80;
                              return (
                                <div key={k}>
                                  <label className="block text-[11px] font-semibold text-[#4a4238] mb-1 capitalize">
                                    {k}
                                  </label>
                                  {isLong ? (
                                    <textarea
                                      rows={3}
                                      value={v}
                                      onChange={(e) =>
                                        updateSimpleField(k, e.target.value)
                                      }
                                      className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={v}
                                      onChange={(e) =>
                                        updateSimpleField(k, e.target.value)
                                      }
                                      className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                                    />
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}

                      {/* Advanced JSON Payload */}
                      <div className="pt-2 border-t border-[#f0ece3]">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1.5">
                          Full Section Payload (JSON)
                        </label>
                        <textarea
                          rows={12}
                          value={editContentJson}
                          onChange={(e) => setEditContentJson(e.target.value)}
                          spellCheck={false}
                          className="w-full p-3.5 text-xs font-mono bg-[#1a1714] text-[#fdfbf7] rounded-lg border border-[#2b2621] focus:outline-none focus:border-[#F8B93C]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-xs text-[#6b6256]">
                    Pilih section di sebelah kiri untuk mulai edit.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* BRANDS MANAGER TAB */
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Add Brand Card */}
              <form
                onSubmit={handleAddBrand}
                className="bg-white border border-[#e0dbd0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-end gap-4"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1.5">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g. Padrón Cigars"
                    className="w-full px-3.5 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1.5">
                    Logo URL / Public Path
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrandLogo}
                    onChange={(e) => setNewBrandLogo(e.target.value)}
                    placeholder="/brands/padron.png"
                    className="w-full px-3.5 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Brand
                </button>
              </form>

              {/* Brands Table */}
              <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[#ece8df] flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1a1714]">
                    All Brands ({brands.length})
                  </h2>
                </div>

                <div className="divide-y divide-[#f0ece3]">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-[#faf8f4]"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-10 bg-[#fdfbf7] border border-[#e6e2d8] rounded flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1a1714] truncate">
                            {brand.name}
                          </p>
                          <p className="text-[10px] font-mono text-[#6b6256] truncate">
                            {brand.logoUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBrand(brand)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            brand.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {brand.isActive ? "Active" : "Hidden"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(brand)}
                          className="p-1.5 text-[#6b6256] hover:text-red-600 transition-colors"
                          title="Delete Brand"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}