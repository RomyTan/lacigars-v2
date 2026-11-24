"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  BellRing,
  Check,
  Copy,
  Pencil,
  Save,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { getDaysUntil } from "@/components/admin/AdminB2BDashboard";

export interface CustomerRecord {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  licenseNumber: string | null;
  resaleTaxNumber: string | null;
  resaleTaxExpirationDate: string | null;
  tobaccoLicense: string | null;
  tobaccoLicenseExpirationDate: string | null;
  licenseAlertLastSentAt: string | null;
  status: string;
  priceTier: string;
  inviteToken: string | null;
  notes: string | null;
  createdAt: string;
}

interface CustomerListViewProps {
  customers: CustomerRecord[];
  onCustomersChange: React.Dispatch<React.SetStateAction<CustomerRecord[]>>;
  onToast: (type: "success" | "error", text: string) => void;
  onTriggerAlertEmail: () => Promise<void>;
  sendingAlerts: boolean;
}

const EMPTY_FORM = {
  id: null as number | null,
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  resaleTaxNumber: "",
  resaleTaxExpirationDate: "",
  tobaccoLicense: "",
  tobaccoLicenseExpirationDate: "",
  priceTier: "STANDARD",
  status: "INVITED",
  notes: "",
};

function renderExpBadge(dateStr: string | null) {
  if (!dateStr) {
    return (
      <span className="text-[10px] text-[#8a8175] italic">No expiry set</span>
    );
  }
  const days = getDaysUntil(dateStr);
  if (days === null) return null;

  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
        <AlertTriangle className="w-2.5 h-2.5" />
        Expired ({dateStr})
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
        <AlertTriangle className="w-2.5 h-2.5" />
        {days}d left ({dateStr})
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium text-emerald-800">
      Valid until {dateStr}
    </span>
  );
}

function hasExpiringLicense(c: CustomerRecord): boolean {
  const t = getDaysUntil(c.resaleTaxExpirationDate);
  const l = getDaysUntil(c.tobaccoLicenseExpirationDate);
  return (t !== null && t <= 30) || (l !== null && l <= 30);
}

export function CustomerListView({
  customers,
  onCustomersChange,
  onToast,
  onTriggerAlertEmail,
  sendingAlerts,
}: CustomerListViewProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const pendingCount = customers.filter((c) => c.status === "PENDING").length;
  const expiringCount = customers.filter(hasExpiringLicense).length;

  const filtered = customers.filter((c) => {
    if (filter === "EXPIRING" && !hasExpiringLicense(c)) return false;
    if (filter !== "ALL" && filter !== "EXPIRING" && c.status !== filter) {
      return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.resaleTaxNumber ?? "").toLowerCase().includes(q) ||
      (c.tobaccoLicense ?? "").toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (cust: CustomerRecord) => {
    setForm({
      id: cust.id,
      companyName: cust.companyName,
      contactName: cust.contactName,
      email: cust.email,
      phone: cust.phone ?? "",
      licenseNumber: cust.licenseNumber ?? "",
      resaleTaxNumber: cust.resaleTaxNumber ?? "",
      resaleTaxExpirationDate: cust.resaleTaxExpirationDate ?? "",
      tobaccoLicense: cust.tobaccoLicense ?? "",
      tobaccoLicenseExpirationDate: cust.tobaccoLicenseExpirationDate ?? "",
      priceTier: cust.priceTier || "STANDARD",
      status: cust.status || "PENDING",
      notes: cust.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.companyName.trim() ||
      !form.contactName.trim() ||
      !form.email.trim()
    ) {
      onToast("error", "Company Name, Contact Name, and Email are required.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = form.id !== null;
      const res = await fetch("/api/cms/customers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        onToast("error", data.error || "Failed to save customer.");
        return;
      }

      if (isEdit) {
        onCustomersChange((prev) =>
          prev.map((c) => (c.id === data.customer.id ? data.customer : c))
        );
        onToast("success", `Customer "${data.customer.companyName}" updated.`);
      } else {
        onCustomersChange((prev) => [data.customer, ...prev]);
        onToast("success", `Customer "${data.customer.companyName}" invited.`);
      }
      setShowModal(false);
    } catch {
      onToast("error", "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (cust: CustomerRecord, status: string) => {
    try {
      const res = await fetch("/api/cms/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cust.id, status }),
      });
      if (!res.ok) throw new Error();
      const { customer: updated } = await res.json();
      onCustomersChange((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      onToast("success", `${updated.companyName} marked as ${status}.`);
    } catch {
      onToast("error", "Failed to update customer status.");
    }
  };

  const handleDelete = async (cust: CustomerRecord) => {
    if (!confirm(`Delete customer "${cust.companyName}"?`)) return;
    try {
      const res = await fetch(`/api/cms/customers?id=${cust.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast("error", data.error || "Failed to delete customer.");
        return;
      }
      onCustomersChange((prev) => prev.filter((c) => c.id !== cust.id));
      onToast("success", `Customer "${cust.companyName}" deleted.`);
    } catch {
      onToast("error", "Failed to delete customer.");
    }
  };

  const handleCopyInvite = (cust: CustomerRecord) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/wholesale?invite=${
      cust.inviteToken || cust.id
    }&email=${encodeURIComponent(cust.email)}`;
    navigator.clipboard?.writeText(link);
    onToast("success", "Customer invite link copied.");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["ALL", `All (${customers.length})`],
              ["PENDING", `Pending Approval (${pendingCount})`],
              [
                "APPROVED",
                `Approved (${
                  customers.filter((c) => c.status === "APPROVED").length
                })`,
              ],
              ["EXPIRING", `Expiring / Expired (${expiringCount})`],
              [
                "REJECTED",
                `Rejected (${
                  customers.filter((c) => c.status === "REJECTED").length
                })`,
              ],
            ] as const
          ).map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setFilter(code)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                filter === code
                  ? "bg-[#241307] text-white border-[#241307]"
                  : code === "EXPIRING" && expiringCount > 0
                  ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                  : "bg-white text-[#4a4238] border-[#dcd4c5] hover:bg-[#faf8f4]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8c6d48] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, tax #, tobacco license..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#dcd4c5] rounded-lg focus:outline-none focus:border-[#8c6d48]"
            />
          </div>

          <button
            type="button"
            disabled={sendingAlerts}
            onClick={onTriggerAlertEmail}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#faf8f4] border border-[#cfc6b6] text-[#1a1714] text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-50"
          >
            <BellRing className="w-3.5 h-3.5 text-[#8c6d48]" />
            {sendingAlerts ? "Sending..." : "Check Expiration Alerts"}
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold whitespace-nowrap transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite New Customer
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e0dbd0] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-[#ece8df] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1a1714]">
            Wholesale Customers &amp; Compliance ({filtered.length})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6b6256]">
            No customer records found for this filter. Click &ldquo;Invite New
            Customer&rdquo; to onboard a wholesale partner.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ece8df] bg-[#faf8f4] text-[10px] uppercase tracking-wider text-[#6b6256]">
                  <th className="py-3 px-4">Company / Contact</th>
                  <th className="py-3 px-4">Resale Tax Number</th>
                  <th className="py-3 px-4">Tobacco License</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece3] text-xs">
                {filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-[#faf8f4] transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#1a1714]">
                        {cust.companyName}
                      </p>
                      <p className="text-[11px] text-[#6b6256]">
                        {cust.contactName} · {cust.email || "No email"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-[11px] font-semibold text-[#1a1714]">
                        {cust.resaleTaxNumber || "—"}
                      </p>
                      <div className="mt-0.5">
                        {renderExpBadge(cust.resaleTaxExpirationDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-[11px] font-semibold text-[#1a1714]">
                        {cust.tobaccoLicense || "—"}
                      </p>
                      <div className="mt-0.5">
                        {renderExpBadge(cust.tobaccoLicenseExpirationDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          cust.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : cust.status === "PENDING"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        {cust.status !== "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(cust, "APPROVED")}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold"
                            title="Approve Customer"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
                          title="Edit Profile & Licenses"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {cust.status !== "REJECTED" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(cust, "REJECTED")}
                            className="p-1.5 text-[#6b6256] hover:text-amber-700"
                            title="Reject / Suspend"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyInvite(cust)}
                          className="p-1.5 text-[#6b6256] hover:text-[#1a1714]"
                          title="Copy Invite Link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cust)}
                          className="p-1.5 text-[#6b6256] hover:text-red-600"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Invite / Edit Customer Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 bg-[#1a1714]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#e0dbd0] rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-[#ece8df] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-[#1a1714]">
                {form.id ? "Edit Customer Profile & Licenses" : "Invite New Customer"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-[#6b6256] hover:text-[#1a1714]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                    placeholder="Sunshine Tobacco LLC"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={(e) =>
                      setForm({ ...form, contactName: e.target.value })
                    }
                    placeholder="John Perez"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="buyer@retailer.com"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(305) 555-0192"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                  />
                </div>
              </div>

              {/* 4 Required Compliance & Expiration Fields */}
              <div className="p-4 rounded-xl bg-[#faf8f4] border border-[#e5dfd3] space-y-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8c6d48]">
                    Tax &amp; Tobacco License Compliance
                  </p>
                  <p className="text-[11px] text-[#6b6256]">
                    LAC will automatically flag accounts and send alerts when
                    licenses are within 30 days of expiration.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4a4238]">
                      Resale Tax Number
                    </label>
                    <input
                      type="text"
                      value={form.resaleTaxNumber}
                      onChange={(e) =>
                        setForm({ ...form, resaleTaxNumber: e.target.value })
                      }
                      placeholder="e.g. 85-8012345678C-1"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#dcd4c5] rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4a4238]">
                      Resale Tax Expiration Date
                    </label>
                    <input
                      type="date"
                      value={form.resaleTaxExpirationDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          resaleTaxExpirationDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#dcd4c5] rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4a4238]">
                      Tobacco License
                    </label>
                    <input
                      type="text"
                      value={form.tobaccoLicense}
                      onChange={(e) =>
                        setForm({ ...form, tobaccoLicense: e.target.value })
                      }
                      placeholder="e.g. FL-RTP-994210"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#dcd4c5] rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4a4238]">
                      Tobacco License Expiration Date
                    </label>
                    <input
                      type="date"
                      value={form.tobaccoLicenseExpirationDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tobaccoLicenseExpirationDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#dcd4c5] rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Account Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                  >
                    <option value="PENDING">Pending Approval</option>
                    <option value="APPROVED">Approved (Portal Enabled)</option>
                    <option value="REJECTED">Rejected / Suspended</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                    Account / QBO Customer #
                  </label>
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={(e) =>
                      setForm({ ...form, licenseNumber: e.target.value })
                    }
                    placeholder="Optional internal ID"
                    className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b6256]">
                  Payment Terms / Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Net 15, delivery route notes..."
                  className="w-full px-3 py-2 text-xs bg-[#fdfbf7] border border-[#dcd4c5] rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-[#ece8df] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#dcd4c5] text-xs font-bold text-[#4a4238]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1a1714] hover:bg-[#8c6d48] text-white text-xs font-bold disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving
                    ? "Saving..."
                    : form.id
                    ? "Save Changes"
                    : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}