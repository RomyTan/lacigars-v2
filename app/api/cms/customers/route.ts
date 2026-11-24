import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface DbCustomerRow {
  id: number;
  customerNumber: string | null;
  displayName: string;
  companyName: string | null;
  primaryEmail: string | null;
  phone: string | null;
  resaleTaxNumber: string | null;
  resaleTaxExpirationDate: Date | null;
  tobaccoLicense: string | null;
  tobaccoLicenseExpirationDate: Date | null;
  licenseAlertLastSentAt: Date | null;
  isActive: boolean;
  portalEnabled: boolean;
  pricingType: string;
  termsName: string | null;
  createdAt: Date;
}

const CUSTOMER_SELECT = {
  id: true,
  customerNumber: true,
  displayName: true,
  companyName: true,
  primaryEmail: true,
  phone: true,
  resaleTaxNumber: true,
  resaleTaxExpirationDate: true,
  tobaccoLicense: true,
  tobaccoLicenseExpirationDate: true,
  licenseAlertLastSentAt: true,
  isActive: true,
  portalEnabled: true,
  pricingType: true,
  termsName: true,
  createdAt: true,
} as const;

function parseDateInput(val: unknown): Date | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(str) ? `${str}T00:00:00.000Z` : str;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateOnly(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function mapCustomerToAdmin(c: DbCustomerRow) {
  const status = !c.isActive
    ? "REJECTED"
    : c.portalEnabled
    ? "APPROVED"
    : "PENDING";

  return {
    id: c.id,
    companyName: c.companyName || c.displayName,
    contactName: c.displayName,
    email: c.primaryEmail ?? "",
    phone: c.phone,
    licenseNumber: c.customerNumber,
    resaleTaxNumber: c.resaleTaxNumber,
    resaleTaxExpirationDate: formatDateOnly(c.resaleTaxExpirationDate),
    tobaccoLicense: c.tobaccoLicense,
    tobaccoLicenseExpirationDate: formatDateOnly(c.tobaccoLicenseExpirationDate),
    licenseAlertLastSentAt: c.licenseAlertLastSentAt
      ? c.licenseAlertLastSentAt.toISOString()
      : null,
    status,
    priceTier: String(c.pricingType),
    inviteToken: String(c.id),
    notes: c.termsName,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await prisma.customer.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: CUSTOMER_SELECT,
    });

    return NextResponse.json({
      customers: rows.map(mapCustomerToAdmin),
    });
  } catch (err) {
    console.error("GET /api/cms/customers error:", err);
    return NextResponse.json(
      { error: "Failed to load customers." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const companyName = String(body.companyName ?? "").trim();
    const contactName = String(body.contactName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "Company Name, Contact Name, and Email are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.customer.findFirst({
      where: { primaryEmail: email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A customer with this email already exists." },
        { status: 409 }
      );
    }

    const status = String(body.status ?? "PENDING").toUpperCase();

    const created = await prisma.customer.create({
      data: {
        displayName: contactName,
        companyName,
        primaryEmail: email,
        phone: body.phone ? String(body.phone).trim() : null,
        customerNumber: body.licenseNumber
          ? String(body.licenseNumber).trim()
          : null,
        resaleTaxNumber: body.resaleTaxNumber
          ? String(body.resaleTaxNumber).trim()
          : null,
        resaleTaxExpirationDate: parseDateInput(body.resaleTaxExpirationDate),
        tobaccoLicense: body.tobaccoLicense
          ? String(body.tobaccoLicense).trim()
          : null,
        tobaccoLicenseExpirationDate: parseDateInput(
          body.tobaccoLicenseExpirationDate
        ),
        termsName: body.notes ? String(body.notes).trim() : null,
        isActive: status !== "REJECTED" && status !== "SUSPENDED",
        portalEnabled: status === "APPROVED",
      },
      select: CUSTOMER_SELECT,
    });

    return NextResponse.json(
      { customer: mapCustomerToAdmin(created) },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/cms/customers error:", err);
    return NextResponse.json(
      { error: "Failed to create customer." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    if (body.companyName !== undefined) {
      data.companyName = String(body.companyName).trim();
    }
    if (body.contactName !== undefined) {
      data.displayName = String(body.contactName).trim();
    }
    if (body.email !== undefined) {
      data.primaryEmail = String(body.email).trim().toLowerCase();
    }
    if (body.phone !== undefined) {
      data.phone = body.phone ? String(body.phone).trim() : null;
    }
    if (body.licenseNumber !== undefined) {
      data.customerNumber = body.licenseNumber
        ? String(body.licenseNumber).trim()
        : null;
    }
    if (body.resaleTaxNumber !== undefined) {
      data.resaleTaxNumber = body.resaleTaxNumber
        ? String(body.resaleTaxNumber).trim()
        : null;
    }
    if (body.resaleTaxExpirationDate !== undefined) {
      data.resaleTaxExpirationDate = parseDateInput(
        body.resaleTaxExpirationDate
      );
    }
    if (body.tobaccoLicense !== undefined) {
      data.tobaccoLicense = body.tobaccoLicense
        ? String(body.tobaccoLicense).trim()
        : null;
    }
    if (body.tobaccoLicenseExpirationDate !== undefined) {
      data.tobaccoLicenseExpirationDate = parseDateInput(
        body.tobaccoLicenseExpirationDate
      );
    }
    if (body.notes !== undefined) {
      data.termsName = body.notes ? String(body.notes).trim() : null;
    }
    if (body.status !== undefined) {
      const nextStatus = String(body.status).toUpperCase();
      if (nextStatus === "APPROVED") {
        data.isActive = true;
        data.portalEnabled = true;
      } else if (nextStatus === "REJECTED" || nextStatus === "SUSPENDED") {
        data.isActive = false;
        data.portalEnabled = false;
      } else {
        data.isActive = true;
        data.portalEnabled = false;
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data,
      select: CUSTOMER_SELECT,
    });

    return NextResponse.json({ customer: mapCustomerToAdmin(updated) });
  } catch (err) {
    console.error("PATCH /api/cms/customers error:", err);
    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2003") {
      return NextResponse.json(
        {
          error:
            "This customer already has order/invoice history. Use Reject/Suspend to deactivate instead.",
        },
        { status: 409 }
      );
    }
    console.error("DELETE /api/cms/customers error:", err);
    return NextResponse.json(
      { error: "Failed to delete customer." },
      { status: 500 }
    );
  }
}