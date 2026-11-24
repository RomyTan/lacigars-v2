"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { INITIAL_HERO_CONFIG } from "@/lib/storefront-data";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Download,
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
  Monitor,
  Smartphone,
  ClipboardList,
  FolderOpen,
  Boxes,
  Copy,
} from "lucide-react";

import {
  AdminB2BDashboard,
  getDaysUntil,
} from "@/components/admin/AdminB2BDashboard";
import {
  CustomerListView,
  type CustomerRecord,
} from "@/components/admin/CustomerListView";

type AdminTab =
  | "dashboard"
  | "sections"
  | "orders"
  | "customers"
  | "brands"
  | "categories"
  | "collections"
  | "products"
  | "files";
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

interface CollectionItem {
  id: number;
  title: string;
  productsCount: number;
  conditions: string;
  salesChannels: number;
}

interface OrderItem {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

interface ExcelImportRow {
  sku: string;
  name: string;
  category: string;
  brand: string;
  vendor: string;
  productType: string;
  boxInfo: string;
  origin: string;
  shape: string;
  wholesalePrice: string;
  quickBooksPrice: string;
  qboQtyOnHand: string;
  description: string;
  image: string;
  isActive: boolean;
  publicVisibilityOverride: boolean;
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
  productType?: string | null;
  vendor?: string | null;
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
  vendor: "",
  productType: "",
  boxInfo: "",
  origin: "",
  shape: "",
  image: "",
  description: "",
  quickBooksPrice: "0",
  wholesalePrice: "",
  qboQtyOnHand: "0",
  isActive: true,
  publicVisibilityOverride: true,
};

const INITIAL_COLLECTIONS: CollectionItem[] = [
  {
    id: 1,
    title: "Best Sellers",
    productsCount: 4,
    conditions: "Tag includes best-seller",
    salesChannels: 3,
  },
  {
    id: 2,
    title: "Premium Cigars",
    productsCount: 1,
    conditions: "Type is equal to Cigars",
    salesChannels: 3,
  },
];

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: "ord-1001",
    orderNumber: "#LAC-1001",
    customer: "Wholesale Retail Account",
    total: 0,
    status: "Pending",
    date: "Today",
  },
];

const DEFAULT_COLLECTION_ITEMS = [
  {
    id: "premium-cigars",
    title: "Premium Cigars",
    count: "140",
    description: "Hand-rolled Nicaraguan, Dominican...",
    href: "/products?category=cigars",
    image: "",
    onlyVisibleForCustomer: false,
  },
  {
    id: "cigarettes",
    title: "Cigarettes & Little Cigars",
    count: "45",
    description: "High-turnover retail cartons &...",
    href: "/products?category=cigarettes",
    image: "",
    onlyVisibleForCustomer: false,
  },
  {
    id: "vapes",
    title: "Vapes & E-Cigs",
    count: "68",
    description: "Compliant retail displays & top-...",
    href: "/products?category=vapes",
    image: "",
    onlyVisibleForCustomer: false,
  },
  {
    id: "accessories",
    title: "Accessories",
    count: "32",
    description: "Humidors, cutters, torch lighters &...",
    href: "/products?category=accessories",
    image: "",
    onlyVisibleForCustomer: false,
  },
];

const HANDLED_CONTENT_KEYS = new Set([
  "heading",
  "headingSize",
  "headingStyle",
  "textColor",
  "showDivider",
  "dividerWidth",
  "dividerThickness",
  "bgColor",
  "bgImage",
  "overlayEnabled",
  "overlayColor",
  "overlayOpacity",
  "productId",
  "productSnapshot",
  "images",
  "cardRadius",
  "cardBorder",
  "cardBorderColor",
  "cardShadow",
  "cards",
  "onlyVisibleForCustomer",
  "collectionSection",
  "collectionEnabled",
  "blocks",
  "items",
  "logoSize",
]);

function formatSectionLabel(sec: CmsSectionRecord): string {
  const title = sec.title.trim();
  if (sec.type === "HERO_3D" && title.toLowerCase().includes("hero")) {
    return "Hero Section";
  }
  if (
    sec.type === "EDITORIAL_CATEGORIES" ||
    sec.type === "COLLECTION_SECTION"
  ) {
    return "Collection Section";
  }
  if (sec.type === "FOOTER" && title.toLowerCase().includes("trust")) {
    return "TrustBar";
  }
  return title;
}

export default function AdminDashboardClient({
  adminEmail,
}: {
  adminEmail?: string;
}) {
  const router = useRouter();
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const prevNavKeyRef = useRef<string | null>(null);
  const prevNavTopRef = useRef<number>(0);
  const [navBlob, setNavBlob] = useState({
    top: 0,
    bottom: 0,
    visible: false,
    transition: "none",
  });

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [editorFocus, setEditorFocus] = useState<EditorFocus>("homepage");
  const [themeSectionsOpen, setThemeSectionsOpen] = useState(true);
  const [previewViewport, setPreviewViewport] =
    useState<PreviewViewport>("desktop");

  const [headerDraft, setHeaderDraft] = useState({
    logoImage: "/lacigars-logo.png",
    logoHeightDesktop: 58,
    logoHeightMobile: 46,
    logoPositionDesktop: "left",
    mainMenu: "main-menu",
    autoFillBrandsDropdown: true,
    autoFillCollectionDropdown: true,
    maxProductsInDropdown: 9,
    navAlignment: "center" as "center" | "left",
    menuFontSize: 12,
    menuItemSpacing: 22,
    uppercaseMenuLinks: true,
    stickyHeader: true,
    showSearchIcon: true,
    showLanguageIcon: false,
    showAccountIcon: true,
    headerPaddingY: 12,
    maxContainerWidth: 1600,
    autoOpenCartOnQuickAdd: true,
    freeShippingThreshold: 100,
    freeShippingProgressText:
      "You're [amount] from Free Domestic Standard Shipping",
    freeShippingUnlockedText:
      "You've unlocked Free Domestic Standard Shipping!",
    cartBadgeColor: "#D92D20",
    facebookUrl: "",
    tiktokUrl: "",
    instagramUrl: "",
    mobileCtaLabel: "Contact Us",
    mobileCtaLink: "",
    mobileCopyrightText:
      "© 2026 Latin American Cigars Corp. All Rights Reserved.",
    headerBgColor: "#FFFFFF",
    headerTextColor: "#10231C",
    headerHoverAccentColor: "#214335",
    headerBorderColor: "#ECECE8",
  });

  const [footerDraft, setFooterDraft] = useState({
    logoImage: "/lacigars-logo.png",
    logoHeight: 44,
    brandLine1: "LATIN AMERICAN",
    brandLine2: "CIGARS CORP.",
    tagline:
      "Wholesale distributor of premium cigars, cigarettes, vapes, and tobacco accessories serving licensed retailers across Florida.",
    ctaHeading: "Ready to stock your store?",
    ctaDescription:
      "Apply for an approved wholesale account to unlock full catalog pricing and online ordering.",
    ctaLabel: "BECOME A CUSTOMER",
    ctaHref: "/contact",
    copyright: "© 2026 Latin American Cigars Corp. All Rights Reserved.",
    bottomRightText: "FLORIDA LICENSED B2B WHOLESALE DISTRIBUTOR",
    bgColor: "#141210",
    textColor: "#fdfbf7",
    accentColor: "#F8B93C",
  });

  const [sections, setSections] = useState<CmsSectionRecord[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editContentJson, setEditContentJson] = useState("{}");

  const [orders] = useState<OrderItem[]>(INITIAL_ORDERS);

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("ALL");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    licenseNumber: "",
    priceTier: "STANDARD",
    status: "INVITED",
    notes: "",
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<ExcelImportRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importingExcel, setImportingExcel] = useState(false);

  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryPublic, setNewCategoryPublic] = useState(true);

  const [collections, setCollections] =
    useState<CollectionItem[]>(INITIAL_COLLECTIONS);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCollectionConditions, setNewCollectionConditions] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");

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

  // Pastikan tidak pernah ada duplikat antara Story Section & Collection Section
  const displaySections = useMemo(() => {
    const hasDedicatedCollection = sections.some(
      (s) => s.type === "COLLECTION_SECTION"
    );
    if (!hasDedicatedCollection) return sections;
    return sections.filter((s) => s.type !== "EDITORIAL_CATEGORIES");
  }, [sections]);

  const selectedSection =
    displaySections.find((s) => s.id === selectedSectionId) ?? null;

  const selectedSectionIndex = selectedSection
    ? displaySections.findIndex((s) => s.id === selectedSection.id)
    : -1;

  const realSectionIndex = selectedSection
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

  const extraStringFields = parsedEditorObj
    ? Object.entries(parsedEditorObj).filter(
        ([k, v]) => typeof v === "string" && !HANDLED_CONTENT_KEYS.has(k)
      )
    : [];

  const buildPreviewSections = () => {
    return displaySections.map((sec) => {
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
        : displaySections.findIndex((s) => s.id === section.id);
    setActiveTab("sections");
    setEditorFocus("homepage");
    setSelectedSectionId(section.id);
    setEditTitle(formatSectionLabel(section));

    const nextContent: Record<string, unknown> = { ...(section.content ?? {}) };
    if (
      section.type === "EDITORIAL_CATEGORIES" ||
      section.type === "COLLECTION_SECTION"
    ) {
      const nested =
        nextContent.collectionSection &&
        typeof nextContent.collectionSection === "object"
          ? (nextContent.collectionSection as Record<string, unknown>)
          : {};

      if (!Array.isArray(nextContent.items)) {
        nextContent.items = Array.isArray(nested.items)
          ? nested.items
          : DEFAULT_COLLECTION_ITEMS;
      }
      if (nextContent.cardRadius === undefined && nested.cardRadius !== undefined) {
        nextContent.cardRadius = nested.cardRadius;
      }
      if (nextContent.cardBorder === undefined && nested.cardBorder !== undefined) {
        nextContent.cardBorder = nested.cardBorder;
      }
      if (
        nextContent.cardBorderColor === undefined &&
        nested.cardBorderColor !== undefined
      ) {
        nextContent.cardBorderColor = nested.cardBorderColor;
      }
      if (nextContent.cardShadow === undefined && nested.cardShadow !== undefined) {
        nextContent.cardShadow = nested.cardShadow;
      }
      if (
        !nextContent.heading ||
        String(nextContent.heading).toLowerCase() ===
          "a legacy of reliable wholesale distribution."
      ) {
        nextContent.heading =
          "Curated wholesale collections built for retail velocity.";
      }
      if (
        !nextContent.ctaLabel ||
        String(nextContent.ctaLabel).toLowerCase() === "our story"
      ) {
        nextContent.ctaLabel = "Our Collection";
      }
      if (!nextContent.ctaHref || nextContent.ctaHref === "/company") {
        nextContent.ctaHref = "/products";
      }
      if (
        !nextContent.paragraph1 ||
        String(nextContent.paragraph1).startsWith(
          "Based in Florida, Latin American Cigars Corp."
        )
      ) {
        nextContent.paragraph1 =
          "Explore our core wholesale categories curated specifically for licensed tobacconists, smoke shops, and retail lounges across Florida. Every line is selected for consistent availability and strong shelf turn.";
      }
      if (
        !nextContent.paragraph2 ||
        String(nextContent.paragraph2).startsWith(
          "From flagship hand-rolled humidors"
        )
      ) {
        nextContent.paragraph2 =
          "From hand-rolled premium cigars and high-demand cigarette cartons to compliant vape displays and humidor accessories, stock your entire storefront through one dependable distributor.";
      }
    }

    setEditContentJson(JSON.stringify(nextContent, null, 2));
    setTimeout(() => {
      postPreviewPayload("homepage", section.id, resolvedIndex);
    }, 0);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, brRes, catRes, prodRes, medRes, custRes] =
        await Promise.all([
          fetch("/api/cms/sections"),
          fetch("/api/cms/brands"),
          fetch("/api/cms/categories"),
          fetch("/api/cms/products"),
          fetch("/api/cms/media"),
          fetch("/api/cms/customers").catch(() => null),
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

      if (custRes && custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.customers ?? []);
      }

      const headerSec = loadedSections.find(
        (s) =>
          s.type.toUpperCase().includes("HEADER") ||
          s.key.toLowerCase().includes("header")
      );
      if (headerSec?.content && typeof headerSec.content === "object") {
        setHeaderDraft((prev) => ({
          ...prev,
          ...(headerSec.content as Partial<typeof prev>),
        }));
      }

      const footerSec = loadedSections.find(
        (s) =>
          s.type.toUpperCase().includes("FOOTER") ||
          s.key.toLowerCase().includes("footer")
      );
      if (footerSec?.content && typeof footerSec.content === "object") {
        setFooterDraft((prev) => ({
          ...prev,
          ...(footerSec.content as Partial<typeof prev>),
        }));
      }

      if (loadedSections.length > 0 && selectedSectionId === null) {
        setSelectedSectionId(loadedSections[0].id);
        setEditTitle(formatSectionLabel(loadedSections[0]));
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
    displaySections,
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

  const updateNestedFields = (patch: Record<string, unknown>) => {
    const base = parsedEditorObj ?? {};
    setEditContentJson(JSON.stringify({ ...base, ...patch }, null, 2));
  };

  const uploadMediaFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file.");
      return null;
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
        return null;
      }

      setMediaList((prev) => [data.media, ...prev]);
      return data.media as CmsMediaRecord;
    } catch {
      showToast("error", "Failed to upload image.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSectionImageUpload = async (file: File) => {
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    const currentImages = Array.isArray(parsedEditorObj?.images)
      ? (parsedEditorObj.images as string[])
      : [];
    updateNestedFields({ images: [...currentImages, uploaded.url] });
    showToast("success", `Image "${file.name}" added to section.`);
  };

  const handleSectionBgUpload = async (file: File) => {
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    updateNestedFields({ bgImage: uploaded.url });
    showToast("success", `Background "${file.name}" applied.`);
  };

  const handleHeroCardBgUpload = async (cardIdx: number, file: File) => {
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    const baseBlocks =
      Array.isArray(parsedEditorObj?.blocks) &&
      (parsedEditorObj?.blocks as unknown[]).length > 0
        ? [...(parsedEditorObj?.blocks as Array<Record<string, unknown>>)]
        : INITIAL_HERO_CONFIG.blocks.map((b) => ({
            ...(b as unknown as Record<string, unknown>),
          }));
    if (baseBlocks[cardIdx]) {
      baseBlocks[cardIdx] = { ...baseBlocks[cardIdx], bgImage: uploaded.url };
      updateNestedFields({ blocks: baseBlocks });
      showToast("success", `Card ${cardIdx + 1} background updated.`);
    }
  };

  const handleCollectionCardImageUpload = async (
    cardIdx: number,
    file: File
  ) => {
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    const baseItems = Array.isArray(parsedEditorObj?.items)
      ? [...(parsedEditorObj?.items as Array<Record<string, unknown>>)]
      : DEFAULT_COLLECTION_ITEMS.map((item) => ({ ...item }));
    if (baseItems[cardIdx]) {
      baseItems[cardIdx] = { ...baseItems[cardIdx], image: uploaded.url };
      updateNestedFields({ items: baseItems });
      showToast("success", `Collection card ${cardIdx + 1} image updated.`);
    }
  };

  const handleHeaderLogoUpload = async (file: File) => {
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    setHeaderDraft((prev) => ({ ...prev, logoImage: uploaded.url }));
    showToast("success", `Header logo "${file.name}" applied.`);
  };

  const handleFooterLogoUpload = async (file: File) => {
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    setFooterDraft((prev) => ({ ...prev, logoImage: uploaded.url }));
    showToast("success", `Footer logo "${file.name}" applied.`);
  };

  const handleSaveHeaderGroup = async () => {
    const headerSec = sections.find(
      (s) =>
        s.type.toUpperCase().includes("HEADER") ||
        s.key.toLowerCase().includes("header")
    );
    if (!headerSec) {
      showToast("success", "Header settings updated in preview.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/cms/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: headerSec.id,
          content: { ...(headerSec.content ?? {}), ...headerDraft },
        }),
      });
      if (!res.ok) throw new Error();
      const { section: updated } = await res.json();
      setSections((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      showToast("success", "Header settings saved to database.");
    } catch {
      showToast("error", "Failed to save header settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageFileUpload = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      showToast("error", "Image size must be under 3MB.");
      return;
    }
    const uploaded = await uploadMediaFile(file);
    if (!uploaded) return;
    setProductForm((prev) => ({ ...prev, image: uploaded.url }));
    showToast("success", `Uploaded "${file.name}" to media library.`);
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
        `${formatSectionLabel(updated)} ${
          updated.isActive ? "enabled" : "hidden"
        }.`
      );
    } catch {
      showToast("error", "Failed to update section visibility.");
    }
  };

  const handleMoveSection = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return;

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
        ...footerDraft,
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
      showToast("success", "Footer settings saved to database.");
    } catch {
      showToast("error", "Failed to save footer settings.");
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

  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionTitle.trim()) return;
    const item: CollectionItem = {
      id: Date.now(),
      title: newCollectionTitle.trim(),
      productsCount: products.length,
      conditions: newCollectionConditions.trim() || "Manual / All active",
      salesChannels: 3,
    };
    setCollections((prev) => [item, ...prev]);
    setNewCollectionTitle("");
    setNewCollectionConditions("");
    showToast("success", `Collection "${item.title}" added.`);
  };

  const handleDeleteCollection = (id: number) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    showToast("success", "Collection removed.");
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
      vendor: product.vendor ?? product.brand ?? "",
      productType: product.productType ?? product.category?.name ?? "",
      boxInfo: product.boxInfo ?? "",
      origin: product.origin ?? "",
      shape: product.shape ?? "",
      image: product.image ?? "",
      description: product.description ?? "",
      quickBooksPrice: String(product.quickBooksPrice ?? 0),
      wholesalePrice:
        product.wholesalePrice !== null ? String(product.wholesalePrice) : "",
      qboQtyOnHand: String(product.qboQtyOnHand ?? 0),
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

  const handleCopyUrl = (url: string) => {
    navigator.clipboard?.writeText(url);
    showToast("success", "File URL copied to clipboard.");
  };

  const handleInviteCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !inviteForm.companyName.trim() ||
      !inviteForm.contactName.trim() ||
      !inviteForm.email.trim()
    ) {
      showToast("error", "Company, Contact Name, and Email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cms/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to invite customer.");
        return;
      }
      setCustomers((prev) => [data.customer, ...prev]);
      setShowInviteModal(false);
      setInviteForm({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        licenseNumber: "",
        priceTier: "STANDARD",
        status: "INVITED",
        notes: "",
      });
      showToast("success", `Customer "${data.customer.companyName}" invited.`);
    } catch {
      showToast("error", "Failed to invite customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCustomerStatus = async (
    customer: CustomerRecord,
    status: string
  ) => {
    try {
      const res = await fetch("/api/cms/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, status }),
      });
      if (!res.ok) throw new Error();
      const { customer: updated } = await res.json();
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      showToast("success", `${updated.companyName} marked as ${status}.`);
    } catch {
      showToast("error", "Failed to update customer status.");
    }
  };

  const handleDeleteCustomer = async (customer: CustomerRecord) => {
    if (!confirm(`Delete customer "${customer.companyName}"?`)) return;
    try {
      const res = await fetch(`/api/cms/customers?id=${customer.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Failed to delete customer.");
        return;
      }
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      showToast("success", `Customer "${customer.companyName}" deleted.`);
    } catch {
      showToast("error", "Failed to delete customer.");
    }
  };

  const handleCopyInviteLink = (customer: CustomerRecord) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/wholesale?invite=${
      customer.inviteToken || customer.id
    }&email=${encodeURIComponent(customer.email)}`;
    navigator.clipboard?.writeText(link);
    showToast("success", "Customer invite link copied.");
  };

  const handleDownloadExcelTemplate = () => {
    const sample = [
      {
        SKU: "LAC-ELB-ROB20",
        Name: "El Bacán Reserve Robusto (Box of 20)",
        Category: "Premium Cigars",
        Brand: "El Bacán",
        Vendor: "El Bacán",
        "Product Type": "Cigars",
        "Box Info": "Box of 20",
        Origin: "Nicaragua",
        Shape: "Robusto 5x52",
        "Wholesale Price": 145,
        "QBO Price": 160,
        Inventory: 25,
        Description: "Hand-rolled Nicaraguan Habano blend.",
        Image: "",
        Active: "TRUE",
        Public: "TRUE",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "LAC_Products_Import_Template.xlsx");
  };

  const handleExcelFileChange = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        firstSheet,
        { defval: "" }
      );

      const pick = (row: Record<string, unknown>, keys: string[]): string => {
        const lowerMap = new Map<string, unknown>();
        for (const [k, v] of Object.entries(row)) {
          lowerMap.set(k.trim().toLowerCase().replace(/[\s_-]+/g, ""), v);
        }
        for (const k of keys) {
          const val = lowerMap.get(k);
          if (val !== undefined && String(val).trim() !== "") {
            return String(val).trim();
          }
        }
        return "";
      };

      const parsed: ExcelImportRow[] = rawRows
        .map((row) => {
          const activeRaw = pick(row, ["active", "isactive", "status"]);
          const publicRaw = pick(row, ["public", "ispublic", "visible"]);
          return {
            sku: pick(row, ["sku", "itemcode", "code", "partnumber"]),
            name: pick(row, [
              "name",
              "productname",
              "title",
              "item",
              "itemname",
            ]),
            category: pick(row, ["category", "categoryname", "group"]),
            brand: pick(row, ["brand", "manufacturer"]),
            vendor: pick(row, ["vendor", "supplier", "brand"]),
            productType: pick(row, ["producttype", "type", "category"]),
            boxInfo: pick(row, [
              "boxinfo",
              "pack",
              "packsize",
              "unit",
              "sellingunit",
            ]),
            origin: pick(row, ["origin", "country"]),
            shape: pick(row, ["shape", "vitola", "size"]),
            wholesalePrice: pick(row, [
              "wholesaleprice",
              "wholesale",
              "b2bprice",
              "cost",
            ]),
            quickBooksPrice: pick(row, [
              "qboprice",
              "quickbooksprice",
              "price",
              "retailprice",
              "msrp",
            ]),
            qboQtyOnHand: pick(row, [
              "inventory",
              "qty",
              "quantity",
              "stock",
              "qtyonhand",
              "qboqtyonhand",
            ]),
            description: pick(row, ["description", "desc", "notes"]),
            image: pick(row, ["image", "imageurl", "photo"]),
            isActive: activeRaw
              ? !["false", "0", "no", "draft", "inactive"].includes(
                  activeRaw.toLowerCase()
                )
              : true,
            publicVisibilityOverride: publicRaw
              ? !["false", "0", "no", "private"].includes(
                  publicRaw.toLowerCase()
                )
              : true,
          };
        })
        .filter((r) => r.sku || r.name);

      if (parsed.length === 0) {
        showToast("error", "No valid product rows found in file.");
        return;
      }

      setImportFileName(file.name);
      setImportRows(parsed);
    } catch {
      showToast(
        "error",
        "Failed to read Excel file. Use .xlsx, .xls, or .csv."
      );
    }
  };

  const handleConfirmExcelImport = async () => {
    if (importRows.length === 0) return;
    setImportingExcel(true);
    try {
      const res = await fetch("/api/cms/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importRows }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Excel import failed.");
        return;
      }

      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      setShowImportModal(false);
      setImportRows([]);
      setImportFileName("");
      showToast(
        "success",
        `Import complete: ${data.created} created, ${data.updated} updated${
          data.skipped ? `, ${data.skipped} skipped` : ""
        }.`
      );
    } catch {
      showToast("error", "Failed to import products.");
    } finally {
      setImportingExcel(false);
    }
  };

  const handleTriggerAlertEmail = async () => {
    setSendingAlerts(true);
    try {
      const res = await fetch("/api/cms/customers/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withinDays: 30 }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Failed to check license alerts.");
        return;
      }
      showToast("success", data.message || "License alert check complete.");
    } catch {
      showToast("error", "Failed to send expiration alerts.");
    } finally {
      setSendingAlerts(false);
    }
  };

  const expiringLicensesCount = customers.filter((c) => {
    if (c.status === "REJECTED") return false;
    const t = getDaysUntil(c.resaleTaxExpirationDate);
    const l = getDaysUntil(c.tobaccoLicenseExpirationDate);
    return (t !== null && t <= 30) || (l !== null && l <= 30);
  }).length;

  const filteredProducts = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q) ||
      (p.vendor ?? "").toLowerCase().includes(q) ||
      (p.productType ?? "").toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q)
    );
  });

  const filteredCollections = collections.filter((c) => {
    const q = collectionSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.conditions.toLowerCase().includes(q)
    );
  });

  const pendingCustomersCount = customers.filter(
    (c) => c.status === "PENDING"
  ).length;

  const filteredCustomers = customers.filter((c) => {
    if (customerFilter !== "ALL" && c.status !== customerFilter) return false;
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.licenseNumber ?? "").toLowerCase().includes(q)
    );
  });

  const isFeaturedProduct = selectedSection?.type === "FEATURED_PRODUCT";
  const isBestSellers = selectedSection?.type === "BEST_SELLERS";
  const isCollectionSection =
    selectedSection?.type === "EDITORIAL_CATEGORIES" ||
    selectedSection?.type === "COLLECTION_SECTION";
  const activeNavKey =
    activeTab === "sections"
      ? editorFocus === "header"
        ? "header"
        : editorFocus === "footer"
        ? "footer"
        : selectedSectionId !== null
        ? `section-${selectedSectionId}`
        : "header"
      : activeTab;

  useLayoutEffect(() => {
    const container = navContainerRef.current;
    if (!container) return;

    const measure = (animate: boolean) => {
      const target = container.querySelector<HTMLElement>(
        `[data-nav-key="${activeNavKey}"]`
      );
      if (!target) {
        setNavBlob((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const cRect = container.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const nextTop = Math.round(tRect.top - cRect.top);
      const nextBottom = Math.round(cRect.bottom - tRect.bottom);

      const isMovingDown = nextTop > prevNavTopRef.current;
      const shouldAnimate =
        animate &&
        prevNavKeyRef.current !== null &&
        prevNavKeyRef.current !== activeNavKey;

      const transition = shouldAnimate
        ? isMovingDown
          ? "bottom 210ms cubic-bezier(0.22, 1, 0.36, 1), top 440ms cubic-bezier(0.32, 1.08, 0.48, 1), opacity 160ms ease"
          : "top 210ms cubic-bezier(0.22, 1, 0.36, 1), bottom 440ms cubic-bezier(0.32, 1.08, 0.48, 1), opacity 160ms ease"
        : "none";

      prevNavKeyRef.current = activeNavKey;
      prevNavTopRef.current = nextTop;

      setNavBlob({
        top: nextTop,
        bottom: nextBottom,
        visible: true,
        transition,
      });
    };

    measure(true);

    const ro = new ResizeObserver(() => measure(false));
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeNavKey, themeSectionsOpen, displaySections.length, loading]);
  return (
    <div className="relative z-100 h-screen overflow-hidden bg-[#1a1714] text-[#1a1714] flex flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes lacPanelReveal {
              0% {
                opacity: 0;
                filter: blur(5px);
                transform: translateY(6px);
              }
              100% {
                opacity: 1;
                filter: blur(0px);
                transform: translateY(0px);
              }
            }
            .lac-panel-reveal {
              animation: lacPanelReveal 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
            }
            .lac-sidebar-scroll {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .lac-sidebar-scroll::-webkit-scrollbar {
              display: none;
            }
            .lac-blob-indicator {
              display: none;
            }
            @media (min-width: 768px) {
              .lac-blob-indicator {
                display: block;
                position: absolute;
                left: 12px;
                right: -1px;
                margin: 0 !important;
                background: #f6f4ef;
                border-radius: 12px 0 0 12px;
                pointer-events: none;
                z-index: 0;
                will-change: top, bottom;
              }
              .lac-blob-indicator::before {
                content: "";
                position: absolute;
                right: 1px;
                top: -12px;
                width: 12px;
                height: 12px;
                pointer-events: none;
                background: radial-gradient(circle at 0 0, transparent 11.5px, #f6f4ef 12px);
              }
              .lac-blob-indicator::after {
                content: "";
                position: absolute;
                right: 1px;
                bottom: -12px;
                width: 12px;
                height: 12px;
                pointer-events: none;
                background: radial-gradient(circle at 0 100%, transparent 11.5px, #f6f4ef 12px);
              }
            }
          `,
        }}
      />
      <header className="h-14 bg-[#1a1714] text-[#fdfbf7] px-5 flex items-center justify-between border-b border-white/10 sticky top-0 z-20 shrink-0">
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

      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Navigation Sidebar */}
        {/* Left Connected Dark Sidebar */}
        {/* Left Connected Dark Sidebar */}
        <aside className="lac-sidebar-scroll w-full md:w-64 bg-[#1a1714] text-[#d8d0c5] shrink-0 md:h-full md:overflow-y-auto select-none">
          <div
            ref={navContainerRef}
            className="relative px-3 md:pl-3 md:pr-0 pt-7 pb-10"
          >
            {/* Single Persistent Liquid-Blob Indicator */}
            <div
              aria-hidden="true"
              className="lac-blob-indicator"
              style={{
                top: `${navBlob.top}px`,
                bottom: `${navBlob.bottom}px`,
                opacity: navBlob.visible ? 1 : 0,
                transition: navBlob.transition,
              }}
            />

            <div className="relative z-10 flex flex-col gap-2">
            {/* 0. DASHBOARD (Top Item) */}
            <button
              type="button"
              data-nav-key="dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors duration-200 ${
                activeNavKey === "dashboard"
                  ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714]"
                  : "text-[#d8d0c5] hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                Dashboard
              </span>
              {expiringLicensesCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                  {expiringLicensesCount}
                </span>
              )}
            </button>

            <hr className="border-white/10 my-2.5 md:mr-4" />

            {/* THEME EDITOR */}
            <div>
              <div className="w-full md:w-[calc(100%-16px)] flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a3998b]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("sections");
                    setThemeSectionsOpen(true);
                  }}
                  className="flex-1 text-left hover:text-white transition-colors"
                >
                  THEME EDITOR
                </button>
                <button
                  type="button"
                  onClick={() => setThemeSectionsOpen((prev) => !prev)}
                  className="p-0.5 rounded hover:bg-white/10 text-[#d8d0c5]"
                  title={themeSectionsOpen ? "Collapse editor" : "Expand editor"}
                >
                  {themeSectionsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {themeSectionsOpen && (
                <div className="pt-1.5 space-y-1">
                  {/* 1. Header */}
                  <button
                    type="button"
                    data-nav-key="header"
                    onClick={() => {
                      setActiveTab("sections");
                      setEditorFocus("header");
                    }}
                    className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                      activeNavKey === "header"
                        ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                        : "text-[#d8d0c5] font-semibold hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className="truncate">1. Header</span>
                  </button>

                  {/* 2..N Theme Sections */}
                  {displaySections.map((sec, idx) => {
                    const key = `section-${sec.id}`;
                    const isCurrent = activeNavKey === key;
                    return (
                      <div
                        key={sec.id}
                        data-nav-key={key}
                        onClick={() => selectSection(sec, idx)}
                        className={`relative z-10 w-full md:w-[calc(100%-16px)] group flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs cursor-pointer transition-colors duration-200 ${
                          isCurrent
                            ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                            : "text-[#d8d0c5] hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <span
                          className={`truncate ${
                            sec.isActive ? "" : "line-through opacity-50"
                          }`}
                        >
                          {idx + 2}. {formatSectionLabel(sec)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                            sec.isActive
                              ? isCurrent
                                ? "bg-[#4f8a2b] text-white"
                                : "bg-white/15 text-[#F8B93C]"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {sec.isActive ? "ON" : "OFF"}
                        </span>
                      </div>
                    );
                  })}

                  {/* Last. Footer */}
                  <button
                    type="button"
                    data-nav-key="footer"
                    onClick={() => {
                      setActiveTab("sections");
                      setEditorFocus("footer");
                    }}
                    className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs transition-colors duration-200 ${
                      activeNavKey === "footer"
                        ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                        : "text-[#d8d0c5] font-semibold hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className="truncate">
                      {displaySections.length + 2}. Footer
                    </span>
                  </button>
                </div>
              )}
            </div>

            <hr className="border-white/10 my-2.5 md:mr-4" />

            {/* B2B OPERATIONS */}
            <div className="space-y-1">
              <button
                type="button"
                data-nav-key="orders"
                onClick={() => setActiveTab("orders")}
                className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 ${
                  activeNavKey === "orders"
                    ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                    : "text-[#d8d0c5] font-semibold hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ClipboardList className="w-3.5 h-3.5 opacity-80" />
                  Orders
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                    activeNavKey === "orders"
                      ? "bg-[#1a1714] text-white"
                      : "bg-white/10 text-[#fdfbf7]"
                  }`}
                >
                  {String(orders.length).padStart(2, "0")}
                </span>
              </button>

              <button
                type="button"
                data-nav-key="customers"
                onClick={() => setActiveTab("customers")}
                className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 ${
                  activeNavKey === "customers"
                    ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                    : "text-[#d8d0c5] font-semibold hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Users className="w-3.5 h-3.5 opacity-80 shrink-0" />
                  <span className="truncate">Customer List</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {(pendingCustomersCount > 0 || expiringLicensesCount > 0) && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                      {pendingCustomersCount + expiringLicensesCount}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      activeNavKey === "customers"
                        ? "bg-[#1a1714] text-white"
                        : "bg-white/10 text-[#fdfbf7]"
                    }`}
                  >
                    {String(customers.length).padStart(2, "0")}
                  </span>
                </span>
              </button>
            </div>

            <hr className="border-white/10 my-2.5 md:mr-4" />

            {/* WHOLESALE CATALOG */}
            <div className="space-y-1">
              <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a3998b]">
                WHOLESALE CATALOG
              </p>

              {(
                [
                  ["brands", "Brands", Tag, brands.length],
                  ["categories", "Categories", FolderTree, categories.length],
                  ["collections", "Collections", Boxes, collections.length],
                  ["products", "Products", Package, products.length],
                ] as const
              ).map(([tabKey, label, Icon, count]) => {
                const isAct = activeNavKey === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    data-nav-key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 ${
                      isAct
                        ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                        : "text-[#d8d0c5] font-semibold hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 opacity-80" />
                      {label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        isAct
                          ? "bg-[#1a1714] text-white"
                          : "bg-white/10 text-[#fdfbf7]"
                      }`}
                    >
                      {String(count).padStart(2, "0")}
                    </span>
                  </button>
                );
              })}
            </div>

            <hr className="border-white/10 my-2.5 md:mr-4" />

            <button
              type="button"
              data-nav-key="files"
              onClick={() => setActiveTab("files")}
              className={`relative z-10 w-full md:w-[calc(100%-16px)] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 ${
                activeNavKey === "files"
                  ? "bg-[#f6f4ef] md:bg-transparent text-[#1a1714] font-bold"
                  : "text-[#d8d0c5] font-semibold hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FolderOpen className="w-3.5 h-3.5 opacity-80" />
                Files
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  activeNavKey === "files"
                    ? "bg-[#1a1714] text-white"
                    : "bg-white/10 text-[#fdfbf7]"
                }`}
              >
                {String(mediaList.length).padStart(2, "0")}
              </span>
            </button>
          </div>
          </div>
        </aside>

        {/* Main Connected Workspace */}
        <main className="flex-1 min-w-0 h-full overflow-hidden bg-[#f6f4ef] md:rounded-tl-xl md:rounded-bl-xl p-4 md:p-6 flex flex-col">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#6b6256]">
              Loading CMS data...
            </div>
          ) : activeTab === "sections" ? (
            <div className="w-full h-full min-h-0 flex flex-col lg:flex-row gap-4 items-stretch overflow-hidden">
              {/* Center Column: Own Scrollbar */}
              <div className="flex-1 min-w-0 h-full overflow-y-auto bg-white border border-[#e0dbd0] rounded-xl shadow-xs flex flex-col">
                <div className="px-4 py-3 bg-[#faf8f4] border-b border-[#ece8df] flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                      Theme Editor Live Preview
                    </p>
                    <h2 className="text-xs font-bold text-[#1a1714]">
                      {editorFocus === "header"
                        ? "Header"
                        : editorFocus === "footer"
                        ? "Footer"
                        : selectedSection
                        ? formatSectionLabel(selectedSection)
                        : "Homepage"}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {editorFocus === "homepage" && selectedSection && (
                      <div className="flex items-center gap-1 bg-[#ebe8e1] px-2 py-1 rounded-lg">
                        <button
                          type="button"
                          disabled={realSectionIndex <= 0}
                          onClick={() =>
                            handleMoveSection(realSectionIndex, -1)
                          }
                          className="p-0.5 rounded hover:bg-white disabled:opacity-30"
                          title="Move Section Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            realSectionIndex < 0 ||
                            realSectionIndex === sections.length - 1
                          }
                          onClick={() => handleMoveSection(realSectionIndex, 1)}
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

                <div className="p-3 bg-[#e4dfd5] flex-1 min-h-0 flex justify-center">
                  <div
                    className={`w-full h-full bg-white border border-[#cfc6b6] rounded-xl overflow-hidden shadow-md transition-all ${
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
                      className="w-full h-full min-h-[760px] border-0 block bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Own Scrollbar */}
              <div className="w-full lg:w-68 shrink-0 h-full overflow-y-auto bg-white border border-[#e0dbd0] rounded-xl shadow-xs">
                {editorFocus === "header" ? (
                  <>
                    <div className="px-4 py-3.5 border-b border-[#ece8df] flex items-center justify-between gap-2 sticky top-0 bg-white z-10">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-[#8c6d48] truncate">
                          GLOBAL HEADER
                        </p>
                        <h2 className="text-sm font-bold text-[#1a1714] truncate">
                          Header Settings
                        </h2>
                      </div>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveHeaderGroup}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[11px] font-bold transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3 h-3" />
                        {saving ? "..." : "Save"}
                      </button>
                    </div>

                    <div className="p-4 space-y-5 text-xs text-[#231f1c]">
                      {/* 1. LOGO & POSITION */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Logo &amp; Position
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-[#4a4238]">
                              Logo image
                            </span>
                            <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold cursor-pointer">
                              <Upload className="w-3 h-3" />
                              {uploadingImage ? "..." : "Upload"}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingImage}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleHeaderLogoUpload(file);
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="relative h-20 rounded-xl border border-[#dcd4c5] bg-[#f8f6f2] overflow-hidden flex items-center justify-center p-2">
                            {headerDraft.logoImage ? (
                              <img
                                src={headerDraft.logoImage}
                                alt="Header Logo"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-[#8a8175]">
                                No logo selected
                              </span>
                            )}
                          </div>

                          {mediaList.length > 0 && (
                            <select
                              value={
                                mediaList.some(
                                  (m) => m.url === headerDraft.logoImage
                                )
                                  ? headerDraft.logoImage
                                  : ""
                              }
                              onChange={(e) => {
                                if (e.target.value) {
                                  setHeaderDraft({
                                    ...headerDraft,
                                    logoImage: e.target.value,
                                  });
                                }
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            >
                              <option value="">-- Pick logo from Files --</option>
                              {mediaList.map((m) => (
                                <option key={m.id} value={m.url}>
                                  {m.fileName}
                                </option>
                              ))}
                            </select>
                          )}

                          <input
                            type="text"
                            value={headerDraft.logoImage}
                            onChange={(e) =>
                              setHeaderDraft({
                                ...headerDraft,
                                logoImage: e.target.value,
                              })
                            }
                            placeholder="/lacigars-logo.png"
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Logo height (Desktop)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={24}
                              max={120}
                              value={headerDraft.logoHeightDesktop}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  logoHeightDesktop: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <div className="flex items-center border border-[#dcd4c5] rounded-lg bg-[#fdfbf7] px-2 py-1 w-16">
                              <input
                                type="number"
                                min={24}
                                max={120}
                                value={headerDraft.logoHeightDesktop}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    logoHeightDesktop:
                                      Number(e.target.value) || 58,
                                  })
                                }
                                className="w-full text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] text-[#6b6256]">
                                px
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Logo height (Mobile)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={20}
                              max={100}
                              value={headerDraft.logoHeightMobile}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  logoHeightMobile: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <div className="flex items-center border border-[#dcd4c5] rounded-lg bg-[#fdfbf7] px-2 py-1 w-16">
                              <input
                                type="number"
                                min={20}
                                max={100}
                                value={headerDraft.logoHeightMobile}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    logoHeightMobile:
                                      Number(e.target.value) || 46,
                                  })
                                }
                                className="w-full text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] text-[#6b6256]">
                                px
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Logo position (Desktop)
                          </label>
                          <select
                            value={headerDraft.logoPositionDesktop}
                            onChange={(e) =>
                              setHeaderDraft({
                                ...headerDraft,
                                logoPositionDesktop: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          >
                            <option value="left">
                              Left (Logo — Nav — Icons)
                            </option>
                            <option value="center">
                              Center (Nav — Logo — Icons)
                            </option>
                            <option value="top-center">
                              Top Center (Logo above Nav)
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* 2. NAVIGATION */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Navigation
                        </p>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Main menu
                          </label>
                          <select
                            value={headerDraft.mainMenu}
                            onChange={(e) =>
                              setHeaderDraft({
                                ...headerDraft,
                                mainMenu: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          >
                            <option value="main-menu">Main menu</option>
                            <option value="wholesale-menu">
                              Wholesale menu
                            </option>
                            <option value="footer-menu">Footer menu</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#4a4238] leading-snug">
                            Auto-fill BRANDS dropdown from store Vendors
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={headerDraft.autoFillBrandsDropdown}
                            onClick={() =>
                              setHeaderDraft({
                                ...headerDraft,
                                autoFillBrandsDropdown:
                                  !headerDraft.autoFillBrandsDropdown,
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                              headerDraft.autoFillBrandsDropdown
                                ? "bg-[#1a1714]"
                                : "bg-[#c8c3b8]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                                headerDraft.autoFillBrandsDropdown
                                  ? "translate-x-4.5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#4a4238] leading-snug">
                            Auto-fill dropdown for all collection menus
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={
                              headerDraft.autoFillCollectionDropdown
                            }
                            onClick={() =>
                              setHeaderDraft({
                                ...headerDraft,
                                autoFillCollectionDropdown:
                                  !headerDraft.autoFillCollectionDropdown,
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                              headerDraft.autoFillCollectionDropdown
                                ? "bg-[#1a1714]"
                                : "bg-[#c8c3b8]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                                headerDraft.autoFillCollectionDropdown
                                  ? "translate-x-4.5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Max products in auto collection dropdown
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={3}
                              max={24}
                              value={headerDraft.maxProductsInDropdown}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  maxProductsInDropdown: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <input
                              type="number"
                              min={3}
                              max={24}
                              value={headerDraft.maxProductsInDropdown}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  maxProductsInDropdown:
                                    Number(e.target.value) || 9,
                                })
                              }
                              className="w-14 px-2 py-1 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Navigation alignment
                          </label>
                          <div className="grid grid-cols-2 p-0.5 rounded-lg bg-[#ebe8e1] border border-[#dcd4c5]">
                            {(["center", "left"] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    navAlignment: align,
                                  })
                                }
                                className={`py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                                  headerDraft.navAlignment === align
                                    ? "bg-white text-[#1a1714] shadow-xs"
                                    : "text-[#6b6256]"
                                }`}
                              >
                                {align}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Menu font size
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={10}
                              max={20}
                              value={headerDraft.menuFontSize}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  menuFontSize: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <div className="flex items-center border border-[#dcd4c5] rounded-lg bg-[#fdfbf7] px-2 py-1 w-16">
                              <input
                                type="number"
                                min={10}
                                max={20}
                                value={headerDraft.menuFontSize}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    menuFontSize: Number(e.target.value) || 12,
                                  })
                                }
                                className="w-full text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] text-[#6b6256]">
                                px
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Space between menu items
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={8}
                              max={48}
                              value={headerDraft.menuItemSpacing}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  menuItemSpacing: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <div className="flex items-center border border-[#dcd4c5] rounded-lg bg-[#fdfbf7] px-2 py-1 w-16">
                              <input
                                type="number"
                                min={8}
                                max={48}
                                value={headerDraft.menuItemSpacing}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    menuItemSpacing:
                                      Number(e.target.value) || 22,
                                  })
                                }
                                className="w-full text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] text-[#6b6256]">
                                px
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#4a4238]">
                            Uppercase menu links
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={headerDraft.uppercaseMenuLinks}
                            onClick={() =>
                              setHeaderDraft({
                                ...headerDraft,
                                uppercaseMenuLinks:
                                  !headerDraft.uppercaseMenuLinks,
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                              headerDraft.uppercaseMenuLinks
                                ? "bg-[#1a1714]"
                                : "bg-[#c8c3b8]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                                headerDraft.uppercaseMenuLinks
                                  ? "translate-x-4.5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* 3. HEADER ICONS & LAYOUT */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Header Icons &amp; Layout
                        </p>

                        {(
                          [
                            ["stickyHeader", "Sticky header on scroll"],
                            ["showSearchIcon", "Show Search icon & drawer"],
                            ["showLanguageIcon", "Show Language icon (EN / ES)"],
                            ["showAccountIcon", "Show Account icon & popup"],
                          ] as const
                        ).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-[11px] text-[#4a4238]">
                              {label}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={headerDraft[key]}
                              onClick={() =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  [key]: !headerDraft[key],
                                })
                              }
                              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                                headerDraft[key]
                                  ? "bg-[#1a1714]"
                                  : "bg-[#c8c3b8]"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                                  headerDraft[key]
                                    ? "translate-x-4.5"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        ))}

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Header top/bottom padding
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={4}
                              max={36}
                              value={headerDraft.headerPaddingY}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  headerPaddingY: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <div className="flex items-center border border-[#dcd4c5] rounded-lg bg-[#fdfbf7] px-2 py-1 w-16">
                              <input
                                type="number"
                                min={4}
                                max={36}
                                value={headerDraft.headerPaddingY}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    headerPaddingY:
                                      Number(e.target.value) || 12,
                                  })
                                }
                                className="w-full text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] text-[#6b6256]">
                                px
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Max container width
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={1024}
                              max={1920}
                              step={16}
                              value={headerDraft.maxContainerWidth}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  maxContainerWidth: Number(e.target.value),
                                })
                              }
                              className="flex-1 accent-[#1a1714]"
                            />
                            <div className="flex items-center border border-[#dcd4c5] rounded-lg bg-[#fdfbf7] px-2 py-1 w-20">
                              <input
                                type="number"
                                min={1024}
                                max={1920}
                                value={headerDraft.maxContainerWidth}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    maxContainerWidth:
                                      Number(e.target.value) || 1600,
                                  })
                                }
                                className="w-full text-xs bg-transparent focus:outline-none"
                              />
                              <span className="text-[10px] text-[#6b6256]">
                                px
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. CART DRAWER */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Cart Drawer
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#4a4238]">
                            Auto-open cart drawer on Quick Add
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={headerDraft.autoOpenCartOnQuickAdd}
                            onClick={() =>
                              setHeaderDraft({
                                ...headerDraft,
                                autoOpenCartOnQuickAdd:
                                  !headerDraft.autoOpenCartOnQuickAdd,
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                              headerDraft.autoOpenCartOnQuickAdd
                                ? "bg-[#1a1714]"
                                : "bg-[#c8c3b8]"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                                headerDraft.autoOpenCartOnQuickAdd
                                  ? "translate-x-4.5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Free shipping threshold (0 to hide)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={headerDraft.freeShippingThreshold}
                            onChange={(e) =>
                              setHeaderDraft({
                                ...headerDraft,
                                freeShippingThreshold:
                                  Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Free shipping progress text
                          </label>
                          <textarea
                            rows={2}
                            value={headerDraft.freeShippingProgressText}
                            onChange={(e) =>
                              setHeaderDraft({
                                ...headerDraft,
                                freeShippingProgressText: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                          <p className="text-[10px] text-[#6b6256]">
                            Use [amount] where the remaining amount should
                            appear.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Free shipping unlocked text
                          </label>
                          <textarea
                            rows={2}
                            value={headerDraft.freeShippingUnlockedText}
                            onChange={(e) =>
                              setHeaderDraft({
                                ...headerDraft,
                                freeShippingUnlockedText: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] text-[#4a4238]">
                            Cart badge &amp; progress bar color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={headerDraft.cartBadgeColor}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  cartBadgeColor: e.target.value,
                                })
                              }
                              className="h-7 w-9 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                            />
                            <input
                              type="text"
                              value={headerDraft.cartBadgeColor}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  cartBadgeColor: e.target.value,
                                })
                              }
                              className="flex-1 px-2.5 py-1 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. MOBILE MENU FOOTER */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Mobile Menu Footer
                        </p>

                        {(
                          [
                            ["facebookUrl", "Facebook URL", "Paste a link or search"],
                            ["tiktokUrl", "TikTok URL", "Paste a link or search"],
                            ["instagramUrl", "Instagram URL", "Paste a link or search"],
                            ["mobileCtaLabel", "CTA button label", "Contact Us"],
                            ["mobileCtaLink", "CTA button link", "Paste a link or search"],
                            [
                              "mobileCopyrightText",
                              "Copyright text",
                              "© 2026 Latin American Cigars Corp. All Rights Reserved.",
                            ],
                          ] as const
                        ).map(([key, label, placeholder]) => (
                          <div key={key} className="space-y-1">
                            <label className="block text-[11px] text-[#4a4238]">
                              {label}
                            </label>
                            <input
                              type="text"
                              value={headerDraft[key]}
                              onChange={(e) =>
                                setHeaderDraft({
                                  ...headerDraft,
                                  [key]: e.target.value,
                                })
                              }
                              placeholder={placeholder}
                              className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                        ))}
                      </div>

                      {/* 6. COLORS */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Colors
                        </p>

                        {(
                          [
                            ["headerBgColor", "Header background"],
                            ["headerTextColor", "Text & icons color"],
                            ["headerHoverAccentColor", "Hover accent color"],
                            ["headerBorderColor", "Bottom border color"],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="space-y-1">
                            <label className="block text-[11px] text-[#4a4238]">
                              {label}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={headerDraft[key]}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    [key]: e.target.value,
                                  })
                                }
                                className="h-7 w-9 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                              />
                              <input
                                type="text"
                                value={headerDraft[key]}
                                onChange={(e) =>
                                  setHeaderDraft({
                                    ...headerDraft,
                                    [key]: e.target.value,
                                  })
                                }
                                className="flex-1 px-2.5 py-1 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : editorFocus === "footer" ? (
                  <>
                    <div className="px-4 py-3.5 border-b border-[#ece8df] flex items-center justify-between gap-2 sticky top-0 bg-white z-10">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-[#8c6d48] truncate">
                          GLOBAL FOOTER
                        </p>
                        <h2 className="text-sm font-bold text-[#1a1714] truncate">
                          Footer Settings
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

                    <div className="p-4 space-y-5 text-xs text-[#231f1c]">
                      {/* 1. BRAND & LOGO */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Brand &amp; Logo
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-[#4a4238]">
                              Footer Logo
                            </span>
                            <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold cursor-pointer">
                              <Upload className="w-3 h-3" />
                              {uploadingImage ? "..." : "Upload"}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingImage}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFooterLogoUpload(file);
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="h-16 rounded-xl border border-[#dcd4c5] bg-[#141210] overflow-hidden flex items-center justify-center p-2">
                            {footerDraft.logoImage ? (
                              <img
                                src={footerDraft.logoImage}
                                alt="Footer Logo"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-[#a3998b]">
                                No logo
                              </span>
                            )}
                          </div>

                          {mediaList.length > 0 && (
                            <select
                              value={
                                mediaList.some(
                                  (m) => m.url === footerDraft.logoImage
                                )
                                  ? footerDraft.logoImage
                                  : ""
                              }
                              onChange={(e) => {
                                if (e.target.value) {
                                  setFooterDraft({
                                    ...footerDraft,
                                    logoImage: e.target.value,
                                  });
                                }
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            >
                              <option value="">-- Pick logo from Files --</option>
                              {mediaList.map((m) => (
                                <option key={m.id} value={m.url}>
                                  {m.fileName}
                                </option>
                              ))}
                            </select>
                          )}

                          <input
                            type="text"
                            value={footerDraft.logoImage}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                logoImage: e.target.value,
                              })
                            }
                            placeholder="/lacigars-logo.png"
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#4a4238]">
                            <span>Logo height</span>
                            <span className="font-mono font-bold text-[#1a1714]">
                              {footerDraft.logoHeight}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={24}
                            max={96}
                            value={footerDraft.logoHeight}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                logoHeight: Number(e.target.value),
                              })
                            }
                            className="w-full accent-[#1a1714]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                              Brand Line 1
                            </label>
                            <input
                              type="text"
                              value={footerDraft.brandLine1}
                              onChange={(e) =>
                                setFooterDraft({
                                  ...footerDraft,
                                  brandLine1: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                              Brand Line 2
                            </label>
                            <input
                              type="text"
                              value={footerDraft.brandLine2}
                              onChange={(e) =>
                                setFooterDraft({
                                  ...footerDraft,
                                  brandLine2: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            Footer Description
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
                      </div>

                      {/* 2. RIGHT CTA BLOCK */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Wholesale CTA Block
                        </p>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            CTA Heading
                          </label>
                          <input
                            type="text"
                            value={footerDraft.ctaHeading}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                ctaHeading: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            CTA Description
                          </label>
                          <textarea
                            rows={3}
                            value={footerDraft.ctaDescription}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                ctaDescription: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            Button Label
                          </label>
                          <input
                            type="text"
                            value={footerDraft.ctaLabel}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                ctaLabel: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            Button Link
                          </label>
                          <input
                            type="text"
                            value={footerDraft.ctaHref}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                ctaHref: e.target.value,
                              })
                            }
                            placeholder="/contact"
                            className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>
                      </div>

                      {/* 3. BOTTOM BAR */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Bottom Bar
                        </p>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            Copyright Text (Left)
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
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                            License / Badge Text (Right)
                          </label>
                          <input
                            type="text"
                            value={footerDraft.bottomRightText}
                            onChange={(e) =>
                              setFooterDraft({
                                ...footerDraft,
                                bottomRightText: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>
                      </div>

                      {/* 4. COLORS */}
                      <div className="space-y-3 pt-4 border-t border-[#ece8df]">
                        <p className="text-xs font-bold text-[#1a1714]">
                          Colors
                        </p>

                        {(
                          [
                            ["bgColor", "Footer Background"],
                            ["textColor", "Text Color"],
                            ["accentColor", "Accent / Button Color"],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="space-y-1">
                            <label className="block text-[11px] text-[#4a4238]">
                              {label}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={footerDraft[key]}
                                onChange={(e) =>
                                  setFooterDraft({
                                    ...footerDraft,
                                    [key]: e.target.value,
                                  })
                                }
                                className="h-7 w-9 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                              />
                              <input
                                type="text"
                                value={footerDraft[key]}
                                onChange={(e) =>
                                  setFooterDraft({
                                    ...footerDraft,
                                    [key]: e.target.value,
                                  })
                                }
                                className="flex-1 px-2.5 py-1 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : selectedSection && parsedEditorObj ? (
                  <>
                    <div className="px-4 py-3.5 border-b border-[#ece8df] flex items-center justify-between gap-2 sticky top-0 bg-white z-10">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-[#8c6d48] truncate">
                          {selectedSection.key}
                        </p>
                        <h2 className="text-sm font-bold text-[#1a1714] truncate">
                          {formatSectionLabel(selectedSection)}
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
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                          Admin Label
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                        />
                      </div>

                      {/* UNIVERSAL HEADING & TEXT COLOR */}
                      <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                          Heading &amp; Text Color
                        </p>
                        <input
                          type="text"
                          value={String(parsedEditorObj.heading ?? "")}
                          onChange={(e) =>
                            updateNestedFields({ heading: e.target.value })
                          }
                          placeholder="Section heading..."
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label className="block text-[10px] text-[#6b6256]">
                              Font Size (px)
                            </label>
                            <input
                              type="number"
                              min={14}
                              max={84}
                              value={Number(parsedEditorObj.headingSize ?? 36)}
                              onChange={(e) =>
                                updateNestedFields({
                                  headingSize: Number(e.target.value) || 36,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="block text-[10px] text-[#6b6256]">
                              Style
                            </label>
                            <select
                              value={String(
                                parsedEditorObj.headingStyle ?? "bold"
                              )}
                              onChange={(e) =>
                                updateNestedFields({
                                  headingStyle: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            >
                              <option value="regular">Regular</option>
                              <option value="bold">Bold</option>
                              <option value="italic">Italic</option>
                              <option value="bold-italic">Bold Italic</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[10px] text-[#6b6256]">
                            Text Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={String(
                                parsedEditorObj.textColor || "#1a1714"
                              )}
                              onChange={(e) =>
                                updateNestedFields({
                                  textColor: e.target.value,
                                })
                              }
                              className="h-7 w-9 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                            />
                            <input
                              type="text"
                              value={String(
                                parsedEditorObj.textColor || "#1a1714"
                              )}
                              onChange={(e) =>
                                updateNestedFields({
                                  textColor: e.target.value,
                                })
                              }
                              placeholder="#1a1714"
                              className="flex-1 px-2.5 py-1 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* UNIVERSAL DIVIDER */}
                      <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Divider
                          </p>
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                parsedEditorObj.showDivider ?? false
                              )}
                              onChange={(e) =>
                                updateNestedFields({
                                  showDivider: e.target.checked,
                                })
                              }
                              className="accent-[#8c6d48]"
                            />
                            {parsedEditorObj.showDivider ? "ON" : "OFF"}
                          </label>
                        </div>
                        {Boolean(parsedEditorObj.showDivider) && (
                          <div className="space-y-2">
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Width (
                                {Number(parsedEditorObj.dividerWidth ?? 100)}
                                %)
                              </label>
                              <input
                                type="range"
                                min={10}
                                max={100}
                                value={Number(
                                  parsedEditorObj.dividerWidth ?? 100
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    dividerWidth: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-[#8c6d48]"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Thickness (
                                {Number(
                                  parsedEditorObj.dividerThickness ?? 1
                                )}
                                px)
                              </label>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={Number(
                                  parsedEditorObj.dividerThickness ?? 1
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    dividerThickness: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-[#8c6d48]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* UNIVERSAL BACKGROUND */}
                      <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                          Background
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={String(
                              parsedEditorObj.bgColor || "#fdfbf7"
                            )}
                            onChange={(e) =>
                              updateNestedFields({ bgColor: e.target.value })
                            }
                            className="h-7 w-9 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={String(
                              parsedEditorObj.bgColor || "#fdfbf7"
                            )}
                            onChange={(e) =>
                              updateNestedFields({ bgColor: e.target.value })
                            }
                            placeholder="#fdfbf7"
                            className="flex-1 px-2.5 py-1 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] font-semibold text-[#4a4238]">
                            Background Image
                          </span>
                          <div className="flex items-center gap-1">
                            {Boolean(parsedEditorObj.bgImage) && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateNestedFields({ bgImage: "" })
                                }
                                className="px-2 py-1 rounded bg-red-50 text-red-700 text-[10px] font-bold hover:bg-red-100"
                              >
                                Clear
                              </button>
                            )}
                            <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold cursor-pointer">
                              <Upload className="w-3 h-3" />
                              {uploadingImage ? "..." : "Upload"}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingImage}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleSectionBgUpload(file);
                                  e.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {mediaList.length > 0 && (
                          <select
                            value={
                              mediaList.some(
                                (m) => m.url === parsedEditorObj.bgImage
                              )
                                ? String(parsedEditorObj.bgImage)
                                : ""
                            }
                            onChange={(e) =>
                              updateNestedFields({ bgImage: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                          >
                            <option value="">
                              -- Pick background from Files --
                            </option>
                            {mediaList.map((m) => (
                              <option key={m.id} value={m.url}>
                                {m.fileName}
                              </option>
                            ))}
                          </select>
                        )}

                        <input
                          type="text"
                          value={String(parsedEditorObj.bgImage ?? "")}
                          onChange={(e) =>
                            updateNestedFields({ bgImage: e.target.value })
                          }
                          placeholder="Or paste background image URL..."
                          className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                        />
                      </div>

                      {/* UNIVERSAL OVERLAY COLOR */}
                      <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Overlay Color
                          </p>
                          <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                parsedEditorObj.overlayEnabled ?? false
                              )}
                              onChange={(e) =>
                                updateNestedFields({
                                  overlayEnabled: e.target.checked,
                                })
                              }
                              className="accent-[#8c6d48]"
                            />
                            {parsedEditorObj.overlayEnabled ? "ON" : "OFF"}
                          </label>
                        </div>

                        {Boolean(parsedEditorObj.overlayEnabled) && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={String(
                                  parsedEditorObj.overlayColor || "#000000"
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    overlayColor: e.target.value,
                                  })
                                }
                                className="h-7 w-9 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                              />
                              <input
                                type="text"
                                value={String(
                                  parsedEditorObj.overlayColor || "#000000"
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    overlayColor: e.target.value,
                                  })
                                }
                                className="flex-1 px-2.5 py-1 text-xs font-mono bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Overlay Opacity (
                                {Number(parsedEditorObj.overlayOpacity ?? 40)}
                                %)
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={Number(
                                  parsedEditorObj.overlayOpacity ?? 40
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    overlayOpacity: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-[#8c6d48]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* HERO 4 CARDS SETTINGS */}
                      {selectedSection.type === "HERO_3D" && (
                        <div className="space-y-3 pt-2 border-t border-[#f0ece3]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Hero Cards (Background &amp; Overlay)
                          </p>
                          {(Array.isArray(parsedEditorObj.blocks) &&
                          (parsedEditorObj.blocks as unknown[]).length > 0
                            ? (parsedEditorObj.blocks as Array<
                                Record<string, unknown>
                              >)
                            : INITIAL_HERO_CONFIG.blocks.map((b) => ({
                                ...(b as unknown as Record<string, unknown>),
                              }))
                          ).map((blk, cardIdx, allBlocks) => {
                            const patchCard = (
                              patch: Record<string, unknown>
                            ) => {
                              const nextBlocks = allBlocks.map((item, i) =>
                                i === cardIdx ? { ...item, ...patch } : item
                              );
                              updateNestedFields({ blocks: nextBlocks });
                            };

                            return (
                              <div
                                key={String(blk.id ?? cardIdx)}
                                className="p-2.5 rounded-lg bg-[#faf8f4] border border-[#e5dfd3] space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-[#1a1714] uppercase">
                                    {cardIdx + 1}. {String(blk.title ?? "Card")}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {Boolean(blk.bgImage) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          patchCard({ bgImage: "" })
                                        }
                                        className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold"
                                      >
                                        Clear
                                      </button>
                                    )}
                                    <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold cursor-pointer">
                                      <Upload className="w-2.5 h-2.5" />
                                      Upload
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingImage}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file)
                                            handleHeroCardBgUpload(
                                              cardIdx,
                                              file
                                            );
                                          e.target.value = "";
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </div>

                                {mediaList.length > 0 && (
                                  <select
                                    value={
                                      mediaList.some(
                                        (m) => m.url === blk.bgImage
                                      )
                                        ? String(blk.bgImage)
                                        : ""
                                    }
                                    onChange={(e) =>
                                      patchCard({ bgImage: e.target.value })
                                    }
                                    className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                  >
                                    <option value="">
                                      -- Pick card bg from Files --
                                    </option>
                                    {mediaList.map((m) => (
                                      <option key={m.id} value={m.url}>
                                        {m.fileName}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                <input
                                  type="text"
                                  value={String(blk.bgImage ?? "")}
                                  onChange={(e) =>
                                    patchCard({ bgImage: e.target.value })
                                  }
                                  placeholder="Card background image URL..."
                                  className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                />

                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-semibold text-[#4a4238]">
                                    Color Overlay
                                  </span>
                                  <label className="inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(
                                        blk.overlayEnabled ?? false
                                      )}
                                      onChange={(e) =>
                                        patchCard({
                                          overlayEnabled: e.target.checked,
                                        })
                                      }
                                      className="accent-[#8c6d48]"
                                    />
                                    {blk.overlayEnabled ? "ON" : "OFF"}
                                  </label>
                                </div>

                                {Boolean(blk.overlayEnabled) && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="color"
                                        value={String(
                                          blk.overlayColor || "#fcfbf9"
                                        )}
                                        onChange={(e) =>
                                          patchCard({
                                            overlayColor: e.target.value,
                                          })
                                        }
                                        className="h-6 w-8 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                                      />
                                      <input
                                        type="text"
                                        value={String(
                                          blk.overlayColor || "#fcfbf9"
                                        )}
                                        onChange={(e) =>
                                          patchCard({
                                            overlayColor: e.target.value,
                                          })
                                        }
                                        className="flex-1 px-2 py-1 text-[11px] font-mono bg-white border border-[#dcd4c5] rounded"
                                      />
                                    </div>

                                    <div className="grid grid-cols-3 gap-1">
                                      {(["full", "left", "right"] as const).map(
                                        (mode) => (
                                          <button
                                            key={mode}
                                            type="button"
                                            onClick={() =>
                                              patchCard({ overlayType: mode })
                                            }
                                            className={`py-1 rounded text-[10px] font-bold capitalize border transition-colors ${
                                              (blk.overlayType ?? "left") ===
                                              mode
                                                ? "bg-[#241307] text-white border-[#241307]"
                                                : "bg-white text-[#4a4238] border-[#dcd4c5]"
                                            }`}
                                          >
                                            {mode}
                                          </button>
                                        )
                                      )}
                                    </div>

                                    <div className="space-y-0.5 pt-0.5">
                                      <label className="block text-[10px] text-[#6b6256]">
                                        Opacity (
                                        {Number(blk.overlayOpacity ?? 80)}%)
                                      </label>
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={Number(blk.overlayOpacity ?? 80)}
                                        onChange={(e) =>
                                          patchCard({
                                            overlayOpacity: Number(
                                              e.target.value
                                            ),
                                          })
                                        }
                                        className="w-full accent-[#8c6d48]"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* FEATURED PRODUCT EXTRA SETTINGS */}
                      {isFeaturedProduct && (
                        <div className="space-y-3 pt-2 border-t border-[#f0ece3]">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                              Select Product (Database)
                            </label>
                            <select
                              value={String(parsedEditorObj.productId ?? "")}
                              onChange={(e) => {
                                const picked = products.find(
                                  (p) => String(p.id) === e.target.value
                                );
                                if (!picked) {
                                  updateNestedFields({
                                    productId: "",
                                    productSnapshot: null,
                                  });
                                  return;
                                }
                                updateNestedFields({
                                  productId: picked.id,
                                  productSnapshot: {
                                    id: picked.id,
                                    sku: picked.sku,
                                    name: picked.name,
                                    brand: picked.brand,
                                    boxInfo: picked.boxInfo,
                                    origin: picked.origin,
                                    shape: picked.shape,
                                    description: picked.description,
                                    image: picked.image,
                                  },
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                            >
                              <option value="">
                                -- Choose product from database --
                              </option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                                Images (Optional)
                              </p>
                              <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold cursor-pointer">
                                <Upload className="w-3 h-3" />
                                {uploadingImage ? "..." : "Upload"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingImage}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleSectionImageUpload(file);
                                    e.target.value = "";
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {mediaList.length > 0 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  const current = Array.isArray(
                                    parsedEditorObj.images
                                  )
                                    ? (parsedEditorObj.images as string[])
                                    : [];
                                  updateNestedFields({
                                    images: [...current, e.target.value],
                                  });
                                }}
                                className="w-full px-2 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                              >
                                <option value="">
                                  + Pick from Files library...
                                </option>
                                {mediaList.map((m) => (
                                  <option key={m.id} value={m.url}>
                                    {m.fileName}
                                  </option>
                                ))}
                              </select>
                            )}

                            {Array.isArray(parsedEditorObj.images) &&
                              (parsedEditorObj.images as string[]).length >
                                0 && (
                                <div className="grid grid-cols-3 gap-1.5">
                                  {(parsedEditorObj.images as string[]).map(
                                    (imgUrl, idx) => (
                                      <div
                                        key={`${imgUrl}-${idx}`}
                                        className="relative aspect-square rounded border border-[#dcd4c5] overflow-hidden bg-[#fdfbf7]"
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Slide ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = (
                                              parsedEditorObj.images as string[]
                                            ).filter((_, i) => i !== idx);
                                            updateNestedFields({
                                              images: next,
                                            });
                                          }}
                                          className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/70 text-white hover:bg-red-600"
                                          title="Remove image"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* BEST SELLERS EXTRA SETTINGS */}
                      {isBestSellers && (
                        <div className="space-y-3 pt-2 border-t border-[#f0ece3]">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                              Card Style
                            </p>
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Round Corner (
                                {Number(parsedEditorObj.cardRadius ?? 12)}px)
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={32}
                                value={Number(parsedEditorObj.cardRadius ?? 12)}
                                onChange={(e) =>
                                  updateNestedFields({
                                    cardRadius: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-[#8c6d48]"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    parsedEditorObj.cardBorder ?? true
                                  )}
                                  onChange={(e) =>
                                    updateNestedFields({
                                      cardBorder: e.target.checked,
                                    })
                                  }
                                  className="accent-[#8c6d48]"
                                />
                                Border
                              </label>
                              {Boolean(parsedEditorObj.cardBorder ?? true) && (
                                <input
                                  type="color"
                                  value={String(
                                    parsedEditorObj.cardBorderColor || "#e5dfd3"
                                  )}
                                  onChange={(e) =>
                                    updateNestedFields({
                                      cardBorderColor: e.target.value,
                                    })
                                  }
                                  className="h-6 w-8 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                                />
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Shadow
                              </label>
                              <select
                                value={String(
                                  parsedEditorObj.cardShadow ?? "sm"
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    cardShadow: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                              >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                              Card Products (Database)
                            </p>
                            {[0, 1, 2, 3].map((slotIdx) => {
                              const currentCards: Array<Record<
                                string,
                                unknown
                              > | null> = Array.isArray(parsedEditorObj.cards)
                                ? (parsedEditorObj.cards as Array<Record<
                                    string,
                                    unknown
                                  > | null>)
                                : [];
                              const currentSlot = currentCards[slotIdx] ?? null;

                              return (
                                <div key={slotIdx} className="space-y-0.5">
                                  <label className="block text-[10px] font-semibold text-[#4a4238]">
                                    Card {slotIdx + 1} Product
                                  </label>
                                  <select
                                    value={String(currentSlot?.id ?? "")}
                                    onChange={(e) => {
                                      const nextCards: Array<Record<
                                        string,
                                        unknown
                                      > | null> = [0, 1, 2, 3].map(
                                        (i) => currentCards[i] ?? null
                                      );
                                      const picked = products.find(
                                        (p) => String(p.id) === e.target.value
                                      );
                                      nextCards[slotIdx] = picked
                                        ? {
                                            id: picked.id,
                                            sku: picked.sku,
                                            name: picked.name,
                                            brand: picked.brand,
                                            boxInfo: picked.boxInfo,
                                            origin: picked.origin,
                                            shape: picked.shape,
                                            image: picked.image,
                                            category:
                                              picked.category?.name ?? "",
                                          }
                                        : null;
                                      updateNestedFields({ cards: nextCards });
                                    }}
                                    className="w-full px-2 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                                  >
                                    <option value="">
                                      -- Default / Empty --
                                    </option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* BRAND MARQUEE LOGO SIZE */}
                      {selectedSection.type === "BRAND_MARQUEE" && (
                        <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Brand Logo Size
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-[#6b6256]">
                              <span>Logo Height</span>
                              <span className="font-mono font-bold text-[#1a1714]">
                                {Number(parsedEditorObj.logoSize ?? 36)}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min={24}
                              max={96}
                              value={Number(parsedEditorObj.logoSize ?? 36)}
                              onChange={(e) =>
                                updateNestedFields({
                                  logoSize: Number(e.target.value),
                                })
                              }
                              className="w-full accent-[#8c6d48]"
                            />
                            <p className="text-[10px] text-[#6b6256]">
                              Text size, padding, and marquee band
                              height scale automatically with 
                              logo size.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* COLLECTION SECTION SETTINGS (CARD STYLE + CARDS) */}
                      {isCollectionSection && (
                        <div className="space-y-3 pt-2 border-t border-[#f0ece3]">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                              Card Style
                            </p>
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Round Corner (
                                {Number(parsedEditorObj.cardRadius ?? 16)}px)
                              </label>
                              <input
                                type="range"
                                min={0}
                                max={32}
                                value={Number(parsedEditorObj.cardRadius ?? 16)}
                                onChange={(e) =>
                                  updateNestedFields({
                                    cardRadius: Number(e.target.value),
                                  })
                                }
                                className="w-full accent-[#8c6d48]"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    parsedEditorObj.cardBorder ?? true
                                  )}
                                  onChange={(e) =>
                                    updateNestedFields({
                                      cardBorder: e.target.checked,
                                    })
                                  }
                                  className="accent-[#8c6d48]"
                                />
                                Border
                              </label>
                              {Boolean(parsedEditorObj.cardBorder ?? true) && (
                                <input
                                  type="color"
                                  value={String(
                                    parsedEditorObj.cardBorderColor || "#e5dfd3"
                                  )}
                                  onChange={(e) =>
                                    updateNestedFields({
                                      cardBorderColor: e.target.value,
                                    })
                                  }
                                  className="h-6 w-8 rounded border border-[#dcd4c5] cursor-pointer bg-white p-0.5"
                                />
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-[#6b6256]">
                                Shadow
                              </label>
                              <select
                                value={String(
                                  parsedEditorObj.cardShadow ?? "sm"
                                )}
                                onChange={(e) =>
                                  updateNestedFields({
                                    cardShadow: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                              >
                                <option value="none">None</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                              </select>
                            </div>
                          </div>

                          {(() => {
                            const currentItems = Array.isArray(
                              parsedEditorObj.items
                            )
                              ? (parsedEditorObj.items as Array<
                                  Record<string, unknown>
                                >)
                              : DEFAULT_COLLECTION_ITEMS.map((item) => ({
                                  ...(item as Record<string, unknown>),
                                }));

                            const updateItems = (
                              nextItems: Array<Record<string, unknown>>
                            ) => {
                              updateNestedFields({ items: nextItems });
                            };

                            return (
                              <div className="space-y-2.5 pt-2 border-t border-[#f0ece3]">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                                    Collection Cards ({currentItems.length})
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItems([
                                        ...currentItems,
                                        {
                                          id: `col-${Date.now()}`,
                                          title: "New Collection",
                                          count: "",
                                          description:
                                            "Short collection summary...",
                                          href: "/products",
                                          image: "",
                                          onlyVisibleForCustomer: false,
                                        },
                                      ])
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Card
                                  </button>
                                </div>

                                {currentItems.map((item, cardIdx) => {
                                  const patchItem = (
                                    patch: Record<string, unknown>
                                  ) => {
                                    updateItems(
                                      currentItems.map((entry, i) =>
                                        i === cardIdx
                                          ? { ...entry, ...patch }
                                          : entry
                                      )
                                    );
                                  };

                                  const moveItem = (dir: -1 | 1) => {
                                    const target = cardIdx + dir;
                                    if (
                                      target < 0 ||
                                      target >= currentItems.length
                                    )
                                      return;
                                    const copy = [...currentItems];
                                    const [moved] = copy.splice(cardIdx, 1);
                                    copy.splice(target, 0, moved);
                                    updateItems(copy);
                                  };

                                  const removeItem = () => {
                                    updateItems(
                                      currentItems.filter(
                                        (_, i) => i !== cardIdx
                                      )
                                    );
                                  };

                                  return (
                                    <div
                                      key={String(item.id ?? cardIdx)}
                                      className="p-2.5 rounded-lg bg-[#faf8f4] border border-[#e5dfd3] space-y-2"
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-[11px] font-bold text-[#1a1714] truncate">
                                          {cardIdx + 1}.{" "}
                                          {String(item.title || "Untitled")}
                                        </span>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          <button
                                            type="button"
                                            disabled={cardIdx === 0}
                                            onClick={() => moveItem(-1)}
                                            className="p-1 rounded hover:bg-white disabled:opacity-30"
                                            title="Move Up"
                                          >
                                            <ArrowUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            disabled={
                                              cardIdx ===
                                              currentItems.length - 1
                                            }
                                            onClick={() => moveItem(1)}
                                            className="p-1 rounded hover:bg-white disabled:opacity-30"
                                            title="Move Down"
                                          >
                                            <ArrowDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={removeItem}
                                            className="p-1 rounded text-[#6b6256] hover:text-red-600 hover:bg-white"
                                            title="Delete Card"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {(categories.length > 0 ||
                                        collections.length > 0) && (
                                        <select
                                          value=""
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const [kind, rawId] = val.split(":");
                                            if (kind === "cat") {
                                              const cat = categories.find(
                                                (c) => String(c.id) === rawId
                                              );
                                              if (cat) {
                                                patchItem({
                                                  title: cat.name,
                                                  count: String(
                                                    cat._count?.products ?? ""
                                                  ),
                                                  href: `/products?category=${encodeURIComponent(
                                                    cat.name.toLowerCase()
                                                  )}`,
                                                });
                                              }
                                            } else if (kind === "col") {
                                              const col = collections.find(
                                                (c) => String(c.id) === rawId
                                              );
                                              if (col) {
                                                patchItem({
                                                  title: col.title,
                                                  count: String(
                                                    col.productsCount
                                                  ),
                                                  href: `/products?collection=${encodeURIComponent(
                                                    col.title.toLowerCase()
                                                  )}`,
                                                });
                                              }
                                            }
                                          }}
                                          className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                        >
                                          <option value="">
                                            -- Quick fill from Category /
                                            Collection --
                                          </option>
                                          {categories.map((cat) => (
                                            <option
                                              key={`cat-${cat.id}`}
                                              value={`cat:${cat.id}`}
                                            >
                                              Category: {cat.name}
                                            </option>
                                          ))}
                                          {collections.map((col) => (
                                            <option
                                              key={`col-${col.id}`}
                                              value={`col:${col.id}`}
                                            >
                                              Collection: {col.title}
                                            </option>
                                          ))}
                                        </select>
                                      )}

                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div className="col-span-2 space-y-0.5">
                                          <label className="block text-[9px] font-semibold uppercase text-[#6b6256]">
                                            Title
                                          </label>
                                          <input
                                            type="text"
                                            value={String(item.title ?? "")}
                                            onChange={(e) =>
                                              patchItem({
                                                title: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                          />
                                        </div>
                                        <div className="space-y-0.5">
                                          <label className="block text-[9px] font-semibold uppercase text-[#6b6256]">
                                            Count
                                          </label>
                                          <input
                                            type="text"
                                            value={String(item.count ?? "")}
                                            onChange={(e) =>
                                              patchItem({
                                                count: e.target.value,
                                              })
                                            }
                                            placeholder="140"
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-0.5">
                                        <label className="block text-[9px] font-semibold uppercase text-[#6b6256]">
                                          Description
                                        </label>
                                        <input
                                          type="text"
                                          value={String(item.description ?? "")}
                                          onChange={(e) =>
                                            patchItem({
                                              description: e.target.value,
                                            })
                                          }
                                          className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                        />
                                      </div>

                                      <div className="space-y-0.5">
                                        <label className="block text-[9px] font-semibold uppercase text-[#6b6256]">
                                          Link URL
                                        </label>
                                        <input
                                          type="text"
                                          value={String(item.href ?? "")}
                                          onChange={(e) =>
                                            patchItem({ href: e.target.value })
                                          }
                                          placeholder="/products?category=cigars"
                                          className="w-full px-2 py-1 text-[11px] font-mono bg-white border border-[#dcd4c5] rounded"
                                        />
                                      </div>

                                      <div className="space-y-1.5 pt-1 border-t border-[#ece8df]">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-semibold text-[#4a4238]">
                                            Card Image
                                          </span>
                                          <div className="flex items-center gap-1">
                                            {Boolean(item.image) && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  patchItem({ image: "" })
                                                }
                                                className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold"
                                              >
                                                Clear
                                              </button>
                                            )}
                                            <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[10px] font-bold cursor-pointer">
                                              <Upload className="w-2.5 h-2.5" />
                                              Upload
                                              <input
                                                type="file"
                                                accept="image/*"
                                                disabled={uploadingImage}
                                                onChange={(e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  if (file)
                                                    handleCollectionCardImageUpload(
                                                      cardIdx,
                                                      file
                                                    );
                                                  e.target.value = "";
                                                }}
                                                className="hidden"
                                              />
                                            </label>
                                          </div>
                                        </div>

                                        {Boolean(item.image) && (
                                          <div className="h-20 w-full rounded border border-[#dcd4c5] bg-white overflow-hidden">
                                            <img
                                              src={String(item.image)}
                                              alt={String(
                                                item.title || "Preview"
                                              )}
                                              className="w-full h-full object-cover"
                                            />
                                          </div>
                                        )}

                                        {mediaList.length > 0 && (
                                          <select
                                            value={
                                              mediaList.some(
                                                (m) => m.url === item.image
                                              )
                                                ? String(item.image)
                                                : ""
                                            }
                                            onChange={(e) =>
                                              patchItem({
                                                image: e.target.value,
                                              })
                                            }
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                          >
                                            <option value="">
                                              -- Pick image from Files --
                                            </option>
                                            {mediaList.map((m) => (
                                              <option key={m.id} value={m.url}>
                                                {m.fileName}
                                              </option>
                                            ))}
                                          </select>
                                        )}

                                        <input
                                          type="text"
                                          value={String(item.image ?? "")}
                                          onChange={(e) =>
                                            patchItem({ image: e.target.value })
                                          }
                                          placeholder="Or paste card image URL..."
                                          className="w-full px-2 py-1 text-[11px] bg-white border border-[#dcd4c5] rounded"
                                        />
                                      </div>

                                      {/* Per-Card Customer Visibility */}
                                      <label className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#ece8df] text-[10px] font-semibold text-[#1a1714] cursor-pointer">
                                        <span>Only visible for customer</span>
                                        <input
                                          type="checkbox"
                                          checked={Boolean(
                                            item.onlyVisibleForCustomer ?? false
                                          )}
                                          onChange={(e) =>
                                            patchItem({
                                              onlyVisibleForCustomer:
                                                e.target.checked,
                                            })
                                          }
                                          className="accent-[#8c6d48]"
                                        />
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* COLLECTION VISIBILITY ACCESS */}
                      {isCollectionSection && (
                        <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Visibility Access (Section)
                          </p>
                          <label className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-[#fdfbf7] border border-[#dcd4c5] text-xs font-semibold text-[#1a1714] cursor-pointer">
                            <span>Only visible for customer</span>
                            <input
                              type="checkbox"
                              checked={Boolean(
                                parsedEditorObj.onlyVisibleForCustomer ?? false
                              )}
                              onChange={(e) =>
                                updateNestedFields({
                                  onlyVisibleForCustomer: e.target.checked,
                                })
                              }
                              className="accent-[#8c6d48]"
                            />
                          </label>
                          <p className="text-[10px] text-[#6b6256]">
                            When enabled, this entire section is
                            only visible to logged-in wholesale customers.
                          </p>
                        </div>
                      )}

                      {extraStringFields.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#f0ece3]">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8c6d48]">
                            Content Fields
                          </p>
                          {extraStringFields.map(([k, v]) => {
                            const strVal = String(v);
                            const isLong = strVal.length > 70;
                            return (
                              <div key={k} className="space-y-0.5">
                                <label className="block text-[10px] font-semibold text-[#4a4238] capitalize">
                                  {k}
                                </label>
                                {isLong ? (
                                  <textarea
                                    rows={3}
                                    value={strVal}
                                    onChange={(e) =>
                                      updateSimpleField(k, e.target.value)
                                    }
                                    className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={strVal}
                                    onChange={(e) =>
                                      updateSimpleField(k, e.target.value)
                                    }
                                    className="w-full px-2.5 py-1.5 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#f0ece3] space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
          ) : (
            <div
              key={activeTab}
              className="flex-1 min-h-0 overflow-y-auto lac-panel-reveal"
            >
              {activeTab === "dashboard" ? (
                <AdminB2BDashboard
                  adminEmail={adminEmail}
                  customers={customers}
                  products={products}
                  categories={categories}
                  brandsCount={brands.length}
                  orders={orders}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onTriggerAlertEmail={handleTriggerAlertEmail}
                  sendingAlerts={sendingAlerts}
                />
              ) : activeTab === "orders" ? (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b border-[#ece8df] flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#1a1714]">
                        Orders ({orders.length})
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#ece8df] bg-[#faf8f4] text-[10px] uppercase tracking-wider text-[#6b6256]">
                            <th className="py-3 px-4">Order</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Total</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0ece3] text-xs">
                          {orders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-[#faf8f4]">
                              <td className="py-3 px-4 font-bold text-[#1a1714]">
                                {ord.orderNumber}
                              </td>
                              <td className="py-3 px-4 text-[#4a4238]">
                                {ord.customer}
                              </td>
                              <td className="py-3 px-4 text-[#6b6256]">
                                {ord.date}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#1a1714]">
                                ${ord.total.toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === "customers" ? (
                <CustomerListView
                  customers={customers}
                  onCustomersChange={setCustomers}
                  onToast={showToast}
                  onTriggerAlertEmail={handleTriggerAlertEmail}
                  sendingAlerts={sendingAlerts}
                />
              ) : activeTab === "brands" ? (
                <div className="max-w-5xl mx-auto space-y-6">
                  <form
                    onSubmit={handleAddBrand}
                    className="bg-white border border-[#e0dbd0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-end gap-4"
                  >
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                    <div className="flex-1 w-full space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                        No categories yet. Create your first category above
                        before adding products.
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
              ) : activeTab === "collections" ? (
                <div className="max-w-6xl mx-auto space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#8c6d48] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={collectionSearch}
                        onChange={(e) => setCollectionSearch(e.target.value)}
                        placeholder="Search collections..."
                        className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                      />
                    </div>

                    <form
                      onSubmit={handleAddCollection}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        required
                        value={newCollectionTitle}
                        onChange={(e) => setNewCollectionTitle(e.target.value)}
                        placeholder="Collection title..."
                        className="px-3 py-2 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                      />
                      <input
                        type="text"
                        value={newCollectionConditions}
                        onChange={(e) =>
                          setNewCollectionConditions(e.target.value)
                        }
                        placeholder="Conditions (optional)"
                        className="px-3 py-2 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add collection
                      </button>
                    </form>
                  </div>

                  <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#ece8df] bg-[#faf8f4] text-[11px] font-semibold text-[#574d42]">
                            <th className="py-3 px-4">Title</th>
                            <th className="py-3 px-4 text-right">Products</th>
                            <th className="py-3 px-4">Conditions</th>
                            <th className="py-3 px-4 text-right">
                              Sales channels
                            </th>
                            <th className="py-3 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0ece3] text-xs">
                          {filteredCollections.map((col) => (
                            <tr key={col.id} className="hover:bg-[#faf8f4]">
                              <td className="py-3 px-4 font-bold text-[#1a1714]">
                                {col.title}
                              </td>
                              <td className="py-3 px-4 text-right text-[#4a4238]">
                                {col.productsCount}
                              </td>
                              <td className="py-3 px-4 text-[#574d42]">
                                {col.conditions}
                              </td>
                              <td className="py-3 px-4 text-right text-[#4a4238]">
                                {col.salesChannels}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCollection(col.id)}
                                  className="p-1 text-[#6b6256] hover:text-red-600"
                                  title="Delete Collection"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === "files" ? (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div className="bg-white border border-[#e0dbd0] rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h2 className="text-sm font-bold text-[#1a1714]">
                        Files ({mediaList.length})
                      </h2>
                      <p className="text-xs text-[#6b6256]">
                        Upload or select files to use across 
                        products and storefront sections.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploadingImage ? "Uploading..." : "Upload File"}
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

                  <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                    {mediaList.length === 0 ? (
                      <div className="p-12 text-center text-xs text-[#6b6256]">
                        No files uploaded yet. Click &ldquo;
                        Upload File&rdquo; to add an image.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
                        {mediaList.map((file) => (
                          <div
                            key={file.id}
                            className="border border-[#e5dfd3] rounded-xl p-3 bg-[#fdfbf7] flex flex-col justify-between gap-3"
                          >
                            <div className="aspect-square rounded-lg bg-white border border-[#ece8df] overflow-hidden flex items-center justify-center">
                              <img
                                src={file.url}
                                alt={file.fileName}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-bold text-[#1a1714] truncate">
                                {file.fileName}
                              </p>
                              <p className="text-[10px] text-[#6b6256]">
                                {Math.max(1, Math.round(file.sizeByte / 1024))}{" "}
                                KB
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyUrl(file.url)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ebe8e1] hover:bg-[#dcd7cc] text-[#1a1714] text-[11px] font-bold transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                Copy URL
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm({
                                    ...EMPTY_PRODUCT_FORM,
                                    categoryId: categories[0]
                                      ? String(categories[0].id)
                                      : "",
                                    image: file.url,
                                  });
                                  setShowProductModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-[11px] font-bold transition-colors"
                              >
                                Use in Product
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

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setImportRows([]);
                          setImportFileName("");
                          setShowImportModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-[#faf8f4] text-[#1a1714] border border-[#cfc6b6] text-xs font-bold transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                        Import from Excel
                      </button>

                      <button
                        type="button"
                        onClick={openNewProductModal}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Product
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#e0dbd0] rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b border-[#ece8df] flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#1a1714]">
                        Wholesale Products ({filteredProducts.length})
                      </h2>
                    </div>

                    {filteredProducts.length === 0 ? (
                      <div className="p-12 text-center text-xs text-[#6b6256]">
                        No products found. Click &ldquo;Add Product&rdquo; to
                        create one.
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
                              <th className="py-3 px-4">Inventory</th>
                              <th className="py-3 px-4">Product Type</th>
                              <th className="py-3 px-4">Vendor</th>
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
                                        src={
                                          product.image || "/hero-products.jpg"
                                        }
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
                                        {product.brand
                                          ? ` · ${product.brand}`
                                          : ""}
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
                                <td className="py-3 px-4 text-[#4a4238] whitespace-nowrap">
                                  {product.qboQtyOnHand ?? 0} in stock
                                </td>
                                <td className="py-3 px-4 text-[#4a4238]">
                                  {product.productType ||
                                    product.category?.name ||
                                    "—"}
                                </td>
                                <td className="py-3 px-4 text-[#4a4238]">
                                  {product.vendor || product.brand || "—"}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditProductModal(product)
                                      }
                                      className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
                                      title="Edit Product"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteProduct(product)
                                      }
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
            </div>
          )}
        </main>
      </div>

      {/* Product Modal */}
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Inventory (Qty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.qboQtyOnHand}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        qboQtyOnHand: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={productForm.productType}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        productType: e.target.value,
                      })
                    }
                    placeholder="e.g. Cigars"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={productForm.vendor}
                    onChange={(e) =>
                      setProductForm({ ...productForm, vendor: e.target.value })
                    }
                    placeholder="e.g. El Bacán"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
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
                      <div className="space-y-1">
                        <label className="block text-[10px] font-semibold text-[#4a4238]">
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
   
      {/* Import from Excel Modal */}
      {showImportModal && (
        <div
          onClick={() => setShowImportModal(false)}
          className="fixed inset-0 bg-[#1a1714]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#e0dbd0] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1a1714]">
                Import Products from Excel (.xlsx / .xls / .csv)
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-[#6b6256] hover:text-[#1a1714]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#faf8f4] border border-[#e5dfd3]">
                <div className="space-y-0.5">
                  <p className="font-bold text-[#1a1714]">
                    Automatic Column Mapping (Upsert by SKU)
                  </p>
                  <p className="text-[11px] text-[#6b6256]">
                    Existing SKUs will be updated; 
                    new SKUs and categories are 
                    created automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#cfc6b6] hover:bg-[#ebe8e1] text-[11px] font-bold text-[#1a1714]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </button>
              </div>

              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-[#cfc6b6] bg-[#fdfbf7] hover:border-[#8c6d48] cursor-pointer transition-colors">
                <FileSpreadsheet className="w-7 h-7 text-emerald-700" />
                <span className="font-bold text-[#1a1714]">
                  {importFileName ||
                    "(Click to select an Excel file (.xlsx, .xls, .csv)"}
                </span>
                <span className="text-[11px] text-[#6b6256]">
                  Required columns: SKU, Name 
                  (optional: Category, Brand, Wholesale 
                  Price, QBO Price, Inventory, Origin, 
                  Shape, Box Info)
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExcelFileChange(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>

              {importRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#1a1714]">
                    Preview ({importRows.length} rows ready to import):
                  </p>
                  <div className="max-h-48 overflow-auto border border-[#e5dfd3] rounded-lg">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#faf8f4] border-b border-[#ece8df] text-[#6b6256]">
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Wholesale</th>
                          <th className="py-2 px-3">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0ece3]">
                        {importRows.slice(0, 8).map((r, idx) => (
                          <tr key={`${r.sku}-${idx}`}>
                            <td className="py-1.5 px-3 font-mono">{r.sku}</td>
                            <td className="py-1.5 px-3 truncate max-w-44">
                              {r.name}
                            </td>
                            <td className="py-1.5 px-3">
                              {r.category || "Uncategorized"}
                            </td>
                            <td className="py-1.5 px-3">
                              {r.wholesalePrice ? `$${r.wholesalePrice}` : "—"}
                            </td>
                            <td className="py-1.5 px-3">
                              {r.qboQtyOnHand || "0"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#ece8df] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#dcd4c5] text-xs font-bold text-[#4a4238]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0 || importingExcel}
                  onClick={handleConfirmExcelImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold disabled:opacity-40"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {importingExcel
                    ? "Importing..."
                    : `Import ${importRows.length} Products`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}