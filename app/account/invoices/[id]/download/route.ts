import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/lib/auth";
import { getUserInvoice, type InvoiceView } from "@/lib/bookings";

export const runtime = "nodejs";

// Matches the service fee added at checkout (app/api/checkout/route.ts).
const SERVICE_FEE_RATE = 0.2;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

// Keep only characters the PDF's standard (WinAnsi) font can encode, so an
// exotic name/title can't crash PDF generation.
function safe(value: string): string {
  return value.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function money(cents: number, currency: string): string {
  const cur = currency.toUpperCase();
  const value = (cents / 100).toFixed(2);
  const symbol = CURRENCY_SYMBOLS[cur];
  return symbol ? `${symbol}${value}` : `${value} ${cur}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function buildInvoicePdf(
  inv: InvoiceView,
  guest: { name: string; email: string },
): Promise<Uint8Array> {
  const number = inv.id.slice(0, 8).toUpperCase();
  const fee = Math.round(inv.priceCents * SERVICE_FEE_RATE);
  const total = inv.priceCents + fee;
  const lineLabel = inv.menuItemName
    ? `${inv.title} - ${inv.menuItemName}`
    : inv.title;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.745, 0.38, 0.251); // terracotta #be6140
  const ink = rgb(0.09, 0.09, 0.09);
  const gray = rgb(0.45, 0.45, 0.5);
  const LEFT = 56;
  const RIGHT = 556;

  const text = (
    s: string,
    x: number,
    y: number,
    size = 11,
    f = font,
    color = ink,
  ) => page.drawText(safe(s), { x, y, size, font: f, color });

  const textRight = (
    s: string,
    y: number,
    size = 11,
    f = font,
    color = ink,
  ) => {
    const safed = safe(s);
    const w = f.widthOfTextAtSize(safed, size);
    page.drawText(safed, { x: RIGHT - w, y, size, font: f, color });
  };

  // Header
  text("Local Experiences", LEFT, 742, 18, bold, brand);
  text("Human as a Service", LEFT, 728, 9, font, gray);
  textRight("INVOICE", 744, 22, bold, ink);
  textRight(`#${number}`, 726, 11, font, gray);
  textRight("Paid - Completed", 712, 10, bold, rgb(0.02, 0.47, 0.34));

  page.drawLine({
    start: { x: LEFT, y: 700 },
    end: { x: RIGHT, y: 700 },
    thickness: 2,
    color: brand,
  });

  // Parties
  text("BILLED TO", LEFT, 676, 9, bold, gray);
  text(guest.name, LEFT, 660, 11);
  text(guest.email, LEFT, 645, 10, font, gray);

  textRight("DETAILS", 676, 9, bold, gray);
  textRight(`Paid on ${formatDate(inv.paidAt)}`, 660, 10, font, gray);
  textRight(`Appointment ${formatDate(inv.appointmentAt)}`, 645, 10, font, gray);
  textRight(`Host: ${inv.hostName}`, 630, 10, font, gray);

  // Line items
  let y = 590;
  text("DESCRIPTION", LEFT, y, 9, bold, gray);
  textRight("AMOUNT", y, 9, bold, gray);
  y -= 10;
  page.drawLine({
    start: { x: LEFT, y },
    end: { x: RIGHT, y },
    thickness: 1,
    color: rgb(0.89, 0.89, 0.91),
  });

  const row = (label: string, amount: string) => {
    y -= 24;
    text(label, LEFT, y, 11);
    textRight(amount, y, 11);
    page.drawLine({
      start: { x: LEFT, y: y - 8 },
      end: { x: RIGHT, y: y - 8 },
      thickness: 1,
      color: rgb(0.89, 0.89, 0.91),
    });
  };

  row(lineLabel, money(inv.priceCents, inv.currency));
  row("Service fee (20%)", money(fee, inv.currency));

  y -= 30;
  text("Total paid", LEFT, y, 14, bold);
  textRight(money(total, inv.currency), y, 14, bold);

  text(
    "Thank you for booking with Local Experiences.",
    LEFT,
    90,
    9,
    font,
    gray,
  );

  return pdf.save();
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const invoice = await getUserInvoice(session.user.id, id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  // Only completed bookings have a downloadable invoice.
  if (invoice.status !== "completed") {
    return NextResponse.json(
      { error: "Invoice is only available once the booking is completed." },
      { status: 409 },
    );
  }

  const pdf = await buildInvoicePdf(invoice, {
    name: session.user.name,
    email: session.user.email,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id.slice(0, 8).toUpperCase()}.pdf"`,
    },
  });
}
