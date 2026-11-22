"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Tag,
  FolderTree,
  Package,
  ArrowUp,
  ArrowDown,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Pencil,
  X,
  Upload,
  Image as ImageIcon,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelTop,
  PanelBottom,
  Monitor,
  Smartphone,
} from "lucide-react";

type AdminTab = "sections" | "brands" | "categories" | "products";
type EditorFocus = "homepage" | "header" | "footer";
type PreviewViewport = "desktop" | "mobile";

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

interface CategoryRecord {
  id: number;
  name: string;
  fullName: string | null;
  isActive: boolean;
  isPublic: boolean;
  _count?: { products: number };
}

interface ProductRecord {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  image: string | null;
  brand: string | null;
  origin: string | null;
  shape: string | null;
  boxInfo: string | null;
  quickBooksPrice: number;
  wholesalePrice: number | null;
  qboQtyOnHand: number;
  isActive: boolean;
  publicVisibilityOverride: boolean | null;
  categoryId: number;
  category?: { id: number; name: string; isPublic: boolean };
}

interface CmsMediaRecord {
  id: number;
  fileName: string;
  mimeType: string;
  sizeByte: number;
  url: string;
  createdAt: string;
}

const EMPTY_PRODUCT_FORM = {
  id: null as number | null,
  sku: "",
  name: "",
  categoryId: "",
  brand: "",
  boxInfo: "",
  origin: "",
  shape: "",
  image: "",
  description: "",
  quickBooksPrice: "0",
  wholesalePrice: "",
  isActive: true,
  publicVisibilityOverride: true,
};

export default function AdminDashboardClient({
  adminEmail,
}: {
  adminEmail?: string;
}) {
  const router = useRouter();
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("sections");
  const [editorFocus, setEditorFocus] = useState<EditorFocus>("homepage");
  const [themeSectionsOpen, setThemeSectionsOpen] = useState(true);
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>("desktop");

  const [headerDraft, setHeaderDraft] = useState({
    brandLabel: "",
    announcement: "",
    ctaLabel: "",
    ctaHref: "",
  });

  const [footerDraft, setFooterDraft] = useState({
    tagline: "",
    copyright: "",
    contactEmail: "",
  });

  const [sections, setSections] = useState<CmsSectionRecord[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editContentJson, setEditContentJson] = useState("{}");

  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPublic, setNewCategoryPublic] = useState(true);

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [mediaList, setMediaList] = useState<CmsMediaRecord[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);

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

  const handleLogout = async () => {
    await fetch("/api/cms/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const selectedSection =
    sections.find((s) => s.id === selectedSectionId) ?? null;

  const selectedSectionIndex = selectedSection
    ? sections.findIndex((s) => s.id === selectedSection.id)
    : -1;

  const parsedEditorObj: Record<string, unknown> | null = (() => {
    try {
      const obj = JSON.parse(editContentJson);
      return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : null;
    } catch {
      return null;
    }
  })();

  const buildPreviewSections = () => {
    return sections.map((sec) => {
      if (sec.id !== selectedSectionId) return sec;
      return {
        ...sec,
        title: editTitle,
        content: parsedEditorObj ?? sec.content,
      };
    });
  };

  const postPreviewPayload = (
    overrideFocus?: EditorFocus,
    overrideSectionId?: number | null,
    overrideSectionIndex?: number
  ) => {
    const win = previewIframeRef.current?.contentWindow;
    if (!win) return;
    const targetFocus = overrideFocus ?? editorFocus;
    const targetId =
      overrideSectionId !== undefined ? overrideSectionId : selectedSectionId;
    const targetIndex =
      overrideSectionIndex !== undefined
        ? overrideSectionIndex
        : selectedSectionIndex;

    win.postMessage(
      {
        source: "lac-cms-preview",
        sections: buildPreviewSections(),
        selectedSectionId: targetId,
        sectionIndex: targetIndex,
        editorFocus: targetFocus,
        headerDraft,
        footerDraft,
      },
      "*"
    );
  };

  const selectSection = (section: CmsSectionRecord, index?: number) => {
    const resolvedIndex =
      typeof index === "number"
        ? index
        : sections.findIndex((s) => s.id === section.id);
    setActiveTab("sections");
    setEditorFocus("homepage");
    setSelectedSectionId(section.id);
    setEditTitle(section.title);
    setEditContentJson(JSON.stringify(section.content ?? {}, null, 2));
    setTimeout(() => {
      postPreviewPayload("homepage", section.id, resolvedIndex);
    }, 0);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, brRes, catRes, prodRes, medRes] = await Promise.all([
        fetch("/api/cms/sections"),
        fetch("/api/cms/brands"),
        fetch("/api/cms/categories"),
        fetch("/api/cms/products"),
        fetch("/api/cms/media"),
      ]);

      if (!secRes.ok || !brRes.ok || !catRes.ok || !prodRes.ok) {
        throw new Error("Database API returned an error");
      }

      const [secData, brData, catData, prodData] = await Promise.all([
        secRes.json(),
        brRes.json(),
        catRes.json(),
        prodRes.json(),
      ]);

      const loadedSections: CmsSectionRecord[] = secData.sections ?? [];
      setSections(loadedSections);
      setBrands(brData.brands ?? []);
      setCategories(catData.categories ?? []);
      setProducts(prodData.products ?? []);

      if (medRes.ok) {
        const medData = await medRes.json();
        setMediaList(medData.media ?? []);
      }

      const footerSec = loadedSections.find(
        (s) =>
          s.type.toUpperCase().includes("FOOTER") ||
          s.key.toLowerCase().includes("footer")
      );
      if (footerSec?.content) {
        setFooterDraft({
          tagline:
            typeof footerSec.content.tagline === "string"
              ? footerSec.content.tagline
              : "",
          copyright:
            typeof footerSec.content.copyright === "string"
              ? footerSec.content.copyright
              : "",
          contactEmail:
            typeof footerSec.content.contactEmail === "string"
              ? footerSec.content.contactEmail
              : "",
        });
      }

      if (loadedSections.length > 0 && selectedSectionId === null) {
        setSelectedSectionId(loadedSections[0].id);
        setEditTitle(loadedSections[0].title);
        setEditContentJson(
          JSON.stringify(loadedSections[0].content ?? {}, null, 2)
        );
      }
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        "Failed to load CMS data. Ensure the database connection is active."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    postPreviewPayload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sections,
    selectedSectionId,
    editTitle,
    editContentJson,
    editorFocus,
    headerDraft,
    footerDraft,
    previewViewport,
    activeTab,
  ]);

  const updateSimpleField = (key: string, value: string | boolean) => {
    if (!parsedEditorObj) return;
    const next = { ...parsedEditorObj, [key]: value };
    setEditContentJson(JSON.stringify(next, null, 2));
  };

  const handleImageFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast("error", "Image size must be under 3MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/cms/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeByte: file.size,
          url: dataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to upload image.");
        return;
      }

      setMediaList((prev) => [data.media, ...prev]);
      setProductForm((prev) => ({ ...prev, image: data.media.url }));
      showToast("success", `Uploaded "${file.name}" to media library.`);
    } catch {
      showToast("error", "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

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
        `${updated.title} ${updated.isActive ? "enabled" : "hidden"}.`
      );
    } catch {
      showToast("error", "Failed to update section visibility.");
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
      showToast("success", "Section order saved.");
    } catch {
      showToast("error", "Failed to save section order.");
      loadData();
    }
  };

  const handleSaveSection = async () => {
    if (!selectedSection) return;
    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(editContentJson);
    } catch {
      showToast("error", "Invalid JSON format in section payload.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/cms/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedSection.id,
          title: editTitle,
          content: parsedContent,
        }),
      });
      if (!res.ok) throw new Error();
      const { section: updated } = await res.json();
      setSections((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      showToast("success", "Section changes saved to database.");
    } catch {
      showToast("error", "Failed to save section changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFooterGroup = async () => {
    const footerSec = sections.find(
      (s) =>
        s.type.toUpperCase().includes("FOOTER") ||
        s.key.toLowerCase().includes("footer")
    );
    if (!footerSec) {
      showToast("success", "Footer draft updated.");
      return;
    }

    setSaving(true);
    try {
      const nextContent = {
        ...(footerSec.content ?? {}),
        tagline: footerDraft.tagline,
        copyright: footerDraft.copyright,
        contactEmail: footerDraft.contactEmail,
      };
      const res = await fetch("/api/cms/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: footerSec.id,
          content: nextContent,
        }),
      });
      if (!res.ok) throw new Error();
      const { section: updated } = await res.json();
      setSections((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      showToast("success", "Footer group saved to database.");
    } catch {
      showToast("error", "Failed to save footer group.");
    } finally {
      setSaving(false);
    }
  };

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
      showToast("success", `Brand "${brand.name}" added.`);
    } catch {
      showToast("error", "Failed to add brand. Check for duplicate names.");
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
      showToast("error", "Failed to update brand status.");
    }
  };

  const handleDeleteBrand = async (brand: BrandRecord) => {
    if (!confirm(`Delete brand "${brand.name}"?`)) return;
    try {
      const res = await fetch(`/api/cms/brands?id=${brand.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
      showToast("success", `Brand "${brand.name}" deleted.`);
    } catch {
      showToast("error", "Failed to delete brand.");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cms/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          isPublic: newCategoryPublic,
          isActive: true,
        }),
      });
      if (!res.ok) throw new Error();
      const { category } = await res.json();
      setCategories((prev) =>
        [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewCategoryName("");
      showToast("success", `Category "${category.name}" created.`);
    } catch {
      showToast("error", "Failed to create category.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryField = async (
    category: CategoryRecord,
    field: "isPublic" | "isActive"
  ) => {
    try {
      const res = await fetch("/api/cms/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          [field]: !category[field],
        }),
      });
      if (!res.ok) throw new Error();
      const { category: updated } = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch {
      showToast("error", "Failed to update category.");
    }
  };

  const handleDeleteCategory = async (category: CategoryRecord) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      const res = await fetch(`/api/cms/categories?id=${category.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to delete category.");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      showToast("success", `Category "${category.name}" deleted.`);
    } catch {
      showToast("error", "Failed to delete category.");
    }
  };

  const openNewProductModal = () => {
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      categoryId: categories[0] ? String(categories[0].id) : "",
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (product: ProductRecord) => {
    setProductForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      categoryId: String(product.categoryId),
      brand: product.brand ?? "",
      boxInfo: product.boxInfo ?? "",
      origin: product.origin ?? "",
      shape: product.shape ?? "",
      image: product.image ?? "",
      description: product.description ?? "",
      quickBooksPrice: String(product.quickBooksPrice ?? 0),
      wholesalePrice:
        product.wholesalePrice !== null ? String(product.wholesalePrice) : "",
      isActive: product.isActive,
      publicVisibilityOverride: product.publicVisibilityOverride ?? true,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !productForm.sku.trim() ||
      !productForm.name.trim() ||
      !productForm.categoryId
    ) {
      showToast("error", "SKU, Product Name, and Category are required.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = productForm.id !== null;
      const res = await fetch("/api/cms/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to save product.");
        return;
      }

      if (isEdit) {
        setProducts((prev) =>
          prev.map((p) => (p.id === data.product.id ? data.product : p))
        );
        showToast("success", `Product "${data.product.name}" updated.`);
      } else {
        setProducts((prev) => [data.product, ...prev]);
        showToast("success", `Product "${data.product.name}" created.`);
      }
      setShowProductModal(false);
    } catch {
      showToast("error", "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductActive = async (product: ProductRecord) => {
    try {
      const res = await fetch("/api/cms/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      });
      if (!res.ok) throw new Error();
      const { product: updated } = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    } catch {
      showToast("error", "Failed to update product status.");
    }
  };

  const handleDeleteProduct = async (product: ProductRecord) => {
    if (!confirm(`Delete product "${product.name}" (${product.sku})?`)) return;
    try {
      const res = await fetch(`/api/cms/products?id=${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to delete product.");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast("success", `Product "${product.name}" deleted.`);
    } catch {
      showToast("error", "Failed to delete product.");
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative z-100 min-h-screen bg-[#f4f3f0] text-[#1a1714] flex flex-col">
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
            {adminEmail || "Admin"}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-[#fdfbf7] transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-white/10 hover:bg-red-600 text-[#fdfbf7] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
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

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-68 bg-[#ebe8e1] border-b md:border-b-0 md:border-r border-[#dcd7cc] p-4 space-y-2 shrink-0">
          <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b6256]">
            Theme Editor
          </p>

          <button
            type="button"
            onClick={() => {
              setActiveTab("sections");
              setEditorFocus("header");
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "sections" && editorFocus === "header"
                ? "bg-white text-[#1a1714] shadow-xs"
                : "text-[#4a4238] hover:bg-white/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <PanelTop className="w-4 h-4 text-[#8c6d48]" />
              Header Group
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("sections");
              setEditorFocus("footer");
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "sections" && editorFocus === "footer"
                ? "bg-white text-[#1a1714] shadow-xs"
                : "text-[#4a4238] hover:bg-white/60"
            }`}
          >
            <span className="flex items-center gap-2">
              <PanelBottom className="w-4 h-4 text-[#8c6d48]" />
              Footer Group
            </span>
          </button>

          <div className="pt-0.5">
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "sections" && editorFocus === "homepage"
                  ? "bg-white text-[#1a1714] shadow-xs"
                  : "text-[#4a4238] hover:bg-white/60"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab("sections");
                  setEditorFocus("homepage");
                  setThemeSectionsOpen(true);
                }}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <Layers className="w-4 h-4 text-[#8c6d48]" />
                <span>Theme Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeSectionsOpen((prev) => !prev)}
                className="p-0.5 rounded hover:bg-[#f4f3f0] text-[#6b6256]"
                title={
                  themeSectionsOpen ? "Collapse sections" : "Expand sections"
                }
              >
                {themeSectionsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {themeSectionsOpen && (
              <div className="mt-1 ml-2 pl-2.5 border-l border-[#d3cdc0] space-y-1">
                {sections.map((sec, idx) => {
                  const isCurrent =
                    activeTab === "sections" &&
                    editorFocus === "homepage" &&
                    sec.id === selectedSectionId;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => selectSection(sec, idx)}
                      className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-[#1a1714] text-[#fdfbf7] font-semibold"
                          : "text-[#4a4238] hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`truncate ${
                          sec.isActive ? "" : "line-through opacity-55"
                        }`}
                      >
                        {idx + 1}. {sec.title}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                          sec.isActive
                            ? isCurrent
                              ? "bg-[#F8B93C]/20 text-[#F8B93C]"
                              : "bg-emerald-100/80 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {sec.isActive ? "ON" : "OFF"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-[#d4cec1]">
            <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b6256]">
              Wholesale Catalog
            </p>

            <div className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveTab("brands")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "brands"
                    ? "bg-white text-[#1a1714] shadow-xs"
                    : "text-[#4a4238] hover:bg-white/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#8c6d48]" />
                  Brands
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f3f0] text-[#6b6256]">
                  {brands.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "categories"
                    ? "bg-white text-[#1a1714] shadow-xs"
                    : "text-[#4a4238] hover:bg-white/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-[#8c6d48]" />
                  Categories
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f3f0] text-[#6b6256]">
                  {categories.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "products"
                    ? "bg-white text-[#1a1714] shadow-xs"
                    : "text-[#4a4238] hover:bg-white/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#8c6d48]" />
                  Products
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f4f3f0] text-[#6b6256]">
                  {products.length}
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-4 md:p-5 overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#6b6256]">
              Loading CMS data...
            </div>
          ) : activeTab === "sections" ? (
            <div className="w-full flex flex-col lg:flex-row gap-4 items-start">
              {/* Center Column: Wider Live Preview */}
              <div className="flex-1 min-w-0 w-full bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#ece8df] flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                      Theme Editor Live Preview
                    </p>
                    <h2 className="text-xs font-bold text-[#1a1714]">
                      {editorFocus === "header"
                        ? "Header Group"
                        : editorFocus === "footer"
                        ? "Footer Group"
                        : selectedSection
                        ? selectedSection.title
                        : "Homepage"}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {editorFocus === "homepage" &&
                      selectedSection &&
                      selectedSectionIndex >= 0 && (
                        <div className="flex items-center gap-1 bg-[#ebe8e1] px-2 py-1 rounded-lg">
                          <button
                            type="button"
                            disabled={selectedSectionIndex === 0}
                            onClick={() =>
                              handleMoveSection(selectedSectionIndex, -1)
                            }
                            className="p-0.5 rounded hover:bg-white disabled:opacity-30"
                            title="Move Section Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              selectedSectionIndex === sections.length - 1
                            }
                            onClick={() =>
                              handleMoveSection(selectedSectionIndex, 1)
                            }
                            className="p-0.5 rounded hover:bg-white disabled:opacity-30"
                            title="Move Section Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSection(selectedSection)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold hover:bg-white"
                          >
                            {selectedSection.isActive ? "ON" : "OFF"}
                          </button>
                        </div>
                      )}

                    <div className="flex items-center gap-1 bg-[#ebe8e1] p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setPreviewViewport("desktop")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                          previewViewport === "desktop"
                            ? "bg-[#1a1714] text-white"
                            : "text-[#4a4238]"
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport("mobile")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                          previewViewport === "mobile"
                            ? "bg-[#1a1714] text-white"
                            : "text-[#4a4238]"
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        Mobile
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#e4dfd5] flex justify-center">
                  <div
                    className={`w-full bg-white border border-[#cfc6b6] rounded-xl overflow-hidden shadow-md transition-all ${
                      previewViewport === "mobile"
                        ? "max-w-[390px]"
                        : "max-w-full"
                    }`}
                  >
                    <iframe
                      ref={previewIframeRef}
                      src="/?cmsPreview=1"
                      title="Storefront Theme Preview"
                      onLoad={() => postPreviewPayload()}
                      className="w-full h-[780px] border-0 block bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Same Width as Left Sidebar */}
              <div className="w-full lg:w-68 shrink-0 bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                {editorFocus === "header" ? (
                  <>
                    <div className="px-4 py-3.5 border-b border-[#ece8df]">
                      <p className="text-[10px] font-mono uppercase text-[#8c6d48]">
                        GLOBAL HEADER GROUP
                      </p>
                      <h2 className="text-sm font-bold text-[#1a1714]">
                        Edit: Header Group
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Brand Label
                        </label>
                        <input
                          type="text"
                          value={headerDraft.brandLabel}
                          onChange={(e) =>
                            setHeaderDraft({
                              ...headerDraft,
                              brandLabel: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Top Bar Note
                        </label>
                        <input
                          type="text"
                          value={headerDraft.announcement}
                          onChange={(e) =>
                            setHeaderDraft({
                              ...headerDraft,
                              announcement: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Action Button Label
                        </label>
                        <input
                          type="text"
                          value={headerDraft.ctaLabel}
                          onChange={(e) =>
                            setHeaderDraft({
                              ...headerDraft,
                              ctaLabel: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Action Link
                        </label>
                        <input
                          type="text"
                          value={headerDraft.ctaHref}
                          onChange={(e) =>
                            setHeaderDraft({
                              ...headerDraft,
                              ctaHref: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                    </div>
                  </>
                ) : editorFocus === "footer" ? (
                  <>
                    <div className="px-4 py-3.5 border-b border-[#ece8df] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-[#8c6d48] truncate">
                          GLOBAL FOOTER GROUP
                        </p>
                        <h2 className="text-sm font-bold text-[#1a1714] truncate">
                          Edit: Footer Group
                        </h2>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveFooterGroup}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[11px] font-bold transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3 h-3" />
                        {saving ? "..." : "Save"}
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Footer Tagline
                        </label>
                        <textarea
                          rows={3}
                          value={footerDraft.tagline}
                          onChange={(e) =>
                            setFooterDraft({
                              ...footerDraft,
                              tagline: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Copyright Line
                        </label>
                        <input
                          type="text"
                          value={footerDraft.copyright}
                          onChange={(e) =>
                            setFooterDraft({
                              ...footerDraft,
                              copyright: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={footerDraft.contactEmail}
                          onChange={(e) =>
                            setFooterDraft({
                              ...footerDraft,
                              contactEmail: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>
                    </div>
                  </>
                ) : selectedSection ? (
                  <>
                    <div className="px-4 py-3.5 border-b border-[#ece8df] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-[#8c6d48] truncate">
                          {selectedSection.key}
                        </p>
                        <h2 className="text-sm font-bold text-[#1a1714] truncate">
                          {selectedSection.title}
                        </h2>
                      </div>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveSection}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[11px] font-bold transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3 h-3" />
                        {saving ? "..." : "Save"}
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Admin Label
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>

                      {parsedEditorObj && (
                        <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Content Fields
                          </p>
                          {Object.entries(parsedEditorObj).map(([k, v]) => {
                            if (typeof v === "string") {
                              const isLong = v.length > 70;
                              return (
                                <div key={k}>
                                  <label className="block text-[10px] font-semibold text-[#4a4238] mb-0.5 capitalize">
                                    {k}
                                  </label>
                                  {isLong ? (
                                    <textarea
                                      rows={3}
                                      value={v}
                                      onChange={(e) =>
                                        updateSimpleField(k, e.target.value)
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={v}
                                      onChange={(e) =>
                                        updateSimpleField(k, e.target.value)
                                      }
                                      className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                                    />
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#f0ece3]">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                          Payload (JSON)
                        </label>
                        <textarea
                          rows={9}
                          value={editContentJson}
                          onChange={(e) => setEditContentJson(e.target.value)}
                          spellCheck={false}
                          className="w-full p-2.5 text-[11px] font-mono bg-[#1a1714] text-[#fdfbf7] rounded-lg border border-[#2b2621] focus:outline-none focus:border-[#F8B93C]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-[#6b6256]">
                    Select a section on the left.
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "brands" ? (
            <div className="max-w-5xl mx-auto space-y-6">
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

              <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[#ece8df]">
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
                        <div className="w-12 h-10 bg-[#fdfbf7] border border-[#e6e2d8] rounded flex items-center justify-center p-1 shrink-0">
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

                      <div className="flex items-center gap-2 shrink-0">
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
          ) : activeTab === "categories" ? (
            <div className="max-w-5xl mx-auto space-y-6">
              <form
                onSubmit={handleAddCategory}
                className="bg-white border border-[#e0dbd0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-end gap-4"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Premium Cigars"
                    className="w-full px-3.5 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#4a4238] pb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCategoryPublic}
                    onChange={(e) => setNewCategoryPublic(e.target.checked)}
                    className="accent-[#8c6d48]"
                  />
                  Public on Storefront
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              </form>

              <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[#ece8df]">
                  <h2 className="text-sm font-bold text-[#1a1714]">
                    All Categories ({categories.length})
                  </h2>
                </div>

                {categories.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#6b6256]">
                    No categories yet. Create your first category above before
                    adding products.
                  </div>
                ) : (
                  <div className="divide-y divide-[#f0ece3]">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#faf8f4]"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#1a1714]">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-[#6b6256]">
                            {cat._count?.products ?? 0} assigned products
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCategoryField(cat, "isPublic")
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              cat.isPublic
                                ? "bg-amber-100 text-amber-900"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {cat.isPublic ? "Public" : "Private"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCategoryField(cat, "isActive")
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              cat.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {cat.isActive ? "Active" : "Inactive"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-[#6b6256] hover:text-red-600 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-[#8c6d48] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search SKU, name, brand, category..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>

                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-[#ece8df] flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1a1714]">
                    Wholesale Products ({filteredProducts.length})
                  </h2>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[#6b6256]">
                    No products found. Click &ldquo;Add Product&rdquo; to create
                    one.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#ece8df] bg-[#faf8f4] text-[10px] uppercase tracking-wider text-[#6b6256]">
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Wholesale</th>
                          <th className="py-3 px-4">QBO Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ece3] text-xs">
                        {filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="hover:bg-[#faf8f4] transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-[#f2efe9] border border-[#e6e2d8] overflow-hidden shrink-0">
                                  <img
                                    src={product.image || "/hero-products.jpg"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-[#1a1714]">
                                    {product.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-[#8c6d48]">
                                    {product.sku}
                                    {product.brand ? ` · ${product.brand}` : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[#4a4238]">
                              {product.category?.name ?? "—"}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#1a1714]">
                              {product.wholesalePrice !== null
                                ? `$${product.wholesalePrice.toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-[#6b6256]">
                              ${product.quickBooksPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleProductActive(product)
                                }
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  product.isActive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {product.isActive ? "Active" : "Draft"}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditProductModal(product)}
                                  className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
                                  title="Edit Product"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product)}
                                  className="p-1.5 text-[#6b6256] hover:text-red-600"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showProductModal && (
        <div
          onClick={() => setShowProductModal(false)}
          className="fixed inset-0 bg-[#1a1714]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#e0dbd0] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-[#1a1714]">
                {productForm.id ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-[#6b6256] hover:text-[#1a1714]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) =>
                      setProductForm({ ...productForm, sku: e.target.value })
                    }
                    placeholder="e.g. LAC-ROB-20"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={productForm.categoryId}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        categoryId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  placeholder="e.g. El Bacán Robusto Maduro (Box of 20)"
                  className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) =>
                      setProductForm({ ...productForm, brand: e.target.value })
                    }
                    placeholder="e.g. El Bacán"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    Pack / Box Info
                  </label>
                  <input
                    type="text"
                    value={productForm.boxInfo}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        boxInfo: e.target.value,
                      })
                    }
                    placeholder="e.g. Box of 20"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    Wholesale Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.wholesalePrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        wholesalePrice: e.target.value,
                      })
                    }
                    placeholder="145.00"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    QuickBooks Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.quickBooksPrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        quickBooksPrice: e.target.value,
                      })
                    }
                    placeholder="160.00"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={productForm.origin}
                    onChange={(e) =>
                      setProductForm({ ...productForm, origin: e.target.value })
                    }
                    placeholder="e.g. Nicaragua"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256] mb-1">
                    Vitola / Shape
                  </label>
                  <input
                    type="text"
                    value={productForm.shape}
                    onChange={(e) =>
                      setProductForm({ ...productForm, shape: e.target.value })
                    }
                    placeholder="e.g. Robusto 5x50"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#f0ece3]">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Product Image
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[11px] font-bold cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileUpload(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-[#fdfbf7] border border-[#e6e2d8]">
                  <div className="w-16 h-16 rounded-lg bg-white border border-[#dcd4c5] overflow-hidden flex items-center justify-center shrink-0">
                    {productForm.image ? (
                      <img
                        src={productForm.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-[#9c9286]" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    {mediaList.length > 0 && (
                      <div>
                        <label className="block text-[10px] font-semibold text-[#4a4238] mb-1">
                          Select from Database Media ({mediaList.length})
                        </label>
                        <select
                          value={
                            mediaList.some((m) => m.url === productForm.image)
                              ? productForm.image
                              : ""
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              setProductForm({
                                ...productForm,
                                image: e.target.value,
                              });
                            }
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        >
                          <option value="">Choose uploaded image...</option>
                          {mediaList.map((m) => (
                            <option key={m.id} value={m.url}>
                              {m.fileName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <input
                      type="text"
                      value={productForm.image}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          image: e.target.value,
                        })
                      }
                      placeholder="Or paste /public path or URL"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#4a4238] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="accent-[#8c6d48]"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#4a4238] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.publicVisibilityOverride}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        publicVisibilityOverride: e.target.checked,
                      })
                    }
                    className="accent-[#8c6d48]"
                  />
                  Visible on Public Storefront
                </label>
              </div>

              <div className="pt-4 border-t border-[#ece8df] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#dcd4c5] text-xs font-bold text-[#4a4238] hover:bg-[#faf8f4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}