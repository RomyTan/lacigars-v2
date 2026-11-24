import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface DbCustomerRow {
  id: number;
  customerNumber: string | null;
  displayName: string;
  companyName: string | null;
  primaryEmail: string | null;
  phone: string | null;
  isActive: boolean;
  portalEnabled: boolean;
  pricingType: string;
  termsName: string | null;
  createdAt: Date;
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
      select: {
        id: true,
        customerNumber: true,
        displayName: true,
        companyName: true,
        primaryEmail: true,
        phone: true,
        isActive: true,
        portalEnabled: true,
        pricingType: true,
        termsName: true,
        createdAt: true,
      },
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
        termsName: body.notes ? String(body.notes).trim() : null,
        isActive: status !== "REJECTED" && status !== "SUSPENDED",
        portalEnabled: status === "APPROVED",
      },
      select: {
        id: true,
        customerNumber: true,
        displayName: true,
        companyName: true,
        primaryEmail: true,
        phone: true,
        isActive: true,
        portalEnabled: true,
        pricingType: true,
        termsName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { customer: mapCustomerToAdmin(created) },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/cms/customers error:", err);
    return NextResponse.json(
      { error: "Failed to invite customer." },
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
        { error: "Customer ID required." },
        { status: 400 }
      );
    }

    const data: {
      companyName?: string;
      displayName?: string;
      primaryEmail?: string;
      phone?: string | null;
      customerNumber?: string | null;
      termsName?: string | null;
      isActive?: boolean;
      portalEnabled?: boolean;
    } = {};

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
      select: {
        id: true,
        customerNumber: true,
        displayName: true,
        companyName: true,
        primaryEmail: true,
        phone: true,
        isActive: true,
        portalEnabled: true,
        pricingType: true,
        termsName: true,
        createdAt: true,
      },
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
        { error: "Customer ID required." },
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
            "Customer ini sudah memiliki riwayat order/invoice. Gunakan Reject untuk menonaktifkan.",
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