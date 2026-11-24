import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface LicenseAlertItem {
  customerId: number;
  companyName: string;
  contactName: string;
  email: string | null;
  documentType: "Resale Tax Number" | "Tobacco License";
  documentNumber: string;
  expirationDate: string;
  daysRemaining: number;
  severity: "EXPIRED" | "EXPIRING_SOON";
}

function computeDaysRemaining(date: Date): number {
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const expUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.round((expUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

async function collectAlerts(withinDays = 30): Promise<LicenseAlertItem[]> {
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      companyName: true,
      displayName: true,
      primaryEmail: true,
      resaleTaxNumber: true,
      resaleTaxExpirationDate: true,
      tobaccoLicense: true,
      tobaccoLicenseExpirationDate: true,
    },
  });

  const alerts: LicenseAlertItem[] = [];

  for (const c of customers) {
    const company = c.companyName || c.displayName;

    if (c.resaleTaxExpirationDate) {
      const taxDate = new Date(c.resaleTaxExpirationDate);
      const days = computeDaysRemaining(taxDate);
      if (days <= withinDays) {
        alerts.push({
          customerId: c.id,
          companyName: company,
          contactName: c.displayName,
          email: c.primaryEmail,
          documentType: "Resale Tax Number",
          documentNumber: c.resaleTaxNumber || "Not recorded",
          expirationDate: taxDate.toISOString().slice(0, 10),
          daysRemaining: days,
          severity: days < 0 ? "EXPIRED" : "EXPIRING_SOON",
        });
      }
    }

    if (c.tobaccoLicenseExpirationDate) {
      const tobDate = new Date(c.tobaccoLicenseExpirationDate);
      const days = computeDaysRemaining(tobDate);
      if (days <= withinDays) {
        alerts.push({
          customerId: c.id,
          companyName: company,
          contactName: c.displayName,
          email: c.primaryEmail,
          documentType: "Tobacco License",
          documentNumber: c.tobaccoLicense || "Not recorded",
          expirationDate: tobDate.toISOString().slice(0, 10),
          daysRemaining: days,
          severity: days < 0 ? "EXPIRED" : "EXPIRING_SOON",
        });
      }
    }
  }

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(180, Number(searchParams.get("days") ?? 30)));
    const alerts = await collectAlerts(days);
    return NextResponse.json({ count: alerts.length, withinDays: days, alerts });
  } catch (err) {
    console.error("GET /api/cms/customers/alerts error:", err);
    return NextResponse.json(
      { error: "Failed to check license expirations." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const withinDays = Math.max(1, Math.min(180, Number(body.withinDays ?? 30)));
    const alerts = await collectAlerts(withinDays);

    if (alerts.length === 0) {
      return NextResponse.json({
        sent: false,
        count: 0,
        message: `All active customer licenses are valid beyond ${withinDays} days.`,
      });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail =
      body.recipientEmail ||
      process.env.ALERT_NOTIFY_EMAIL ||
      process.env.ADMIN_EMAIL;
    const fromEmail =
      process.env.ALERT_FROM_EMAIL || "LAC Compliance <onboarding@resend.dev>";

    let emailDispatched = false;
    let deliveryNote =
      "In-app alerts synced. Add RESEND_API_KEY & ALERT_NOTIFY_EMAIL in Vercel env to enable automatic email delivery.";

    if (resendKey && notifyEmail) {
      const rowsHtml = alerts
        .map(
          (a) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5dfd3;"><strong>${a.companyName}</strong><br/><span style="color:#6b6256;font-size:12px;">${a.contactName}</span></td>
            <td style="padding:8px;border-bottom:1px solid #e5dfd3;">${a.documentType}<br/><code style="font-size:12px;">${a.documentNumber}</code></td>
            <td style="padding:8px;border-bottom:1px solid #e5dfd3;">${a.expirationDate}</td>
            <td style="padding:8px;border-bottom:1px solid #e5dfd3;font-weight:bold;color:${
              a.severity === "EXPIRED" ? "#b91c1c" : "#b45309"
            };">${
              a.daysRemaining < 0
                ? `Expired ${Math.abs(a.daysRemaining)}d ago`
                : a.daysRemaining === 0
                ? "Expires today"
                : `In ${a.daysRemaining} days`
            }</td>
          </tr>`
        )
        .join("");

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1714;">
          <h2 style="margin-bottom:4px;">LAC Customer License Expiration Alert</h2>
          <p style="color:#6b6256;font-size:14px;">${alerts.length} customer document(s) require attention (expired or expiring within ${withinDays} days).</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
            <thead>
              <tr style="background:#faf8f4;text-align:left;">
                <th style="padding:8px;border-bottom:1px solid #dcd4c5;">Customer</th>
                <th style="padding:8px;border-bottom:1px solid #dcd4c5;">License</th>
                <th style="padding:8px;border-bottom:1px solid #dcd4c5;">Exp. Date</th>
                <th style="padding:8px;border-bottom:1px solid #dcd4c5;">Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>`;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [notifyEmail],
          subject: `[LAC Alert] ${alerts.length} Customer License(s) Expiring or Expired`,
          html,
        }),
      });

      if (resendRes.ok) {
        emailDispatched = true;
        deliveryNote = `Expiration alert email sent to ${notifyEmail}.`;
      } else {
        const errText = await resendRes.text();
        deliveryNote = `Email provider error: ${errText}`;
      }
    }

    const impactedIds = Array.from(new Set(alerts.map((a) => a.customerId)));
    await prisma.customer.updateMany({
      where: { id: { in: impactedIds } },
      data: { licenseAlertLastSentAt: new Date() },
    });

    return NextResponse.json({
      sent: emailDispatched,
      count: alerts.length,
      message: deliveryNote,
      alerts,
    });
  } catch (err) {
    console.error("POST /api/cms/customers/alerts error:", err);
    return NextResponse.json(
      { error: "Failed to process expiration alerts." },
      { status: 500 }
    );
  }
}