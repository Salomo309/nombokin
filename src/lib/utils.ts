import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

// ---- Tailwind class merging ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Currency formatting ----
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "Rp 0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ---- Invoice number generator ----
export function generateInvoiceNumber(
  type: "INVOICE" | "QUOTATION",
  sequence: number,
  year?: number
): string {
  const y = year ?? new Date().getFullYear();
  const prefix = type === "INVOICE" ? "INV" : "QUO";
  const seq = String(sequence).padStart(4, "0");
  return `${prefix}-${y}-${seq}`;
}

// ---- Share token ----
export function generateShareToken(): string {
  return nanoid(24);
}

// ---- Slug generator ----
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ---- Date formatting (Indonesian locale) ----
export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

// ---- Calculate invoice totals ----
export function calculateInvoiceTotals(
  items: Array<{ qty: number; unitPrice: number }>,
  discountPercent: number,
  taxPercent: number
): { subtotal: number; discountAmount: number; taxAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxPercent / 100);
  const total = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
}

// ---- WhatsApp deep link ----
export function buildWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  const cleaned = phoneNumber.replace(/\D/g, "");
  const normalized = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

// ---- Status labels (Indonesian) ----
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draf",
  SENT: "Terkirim",
  PAID: "Lunas",
  OVERDUE: "Jatuh Tempo",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
};

export const STATUS_COLORS: Record<
  string,
  { dot: string; bg: string; text: string }
> = {
  DRAFT: { dot: "bg-stone-400", bg: "bg-stone-100", text: "text-stone-600" },
  SENT: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  PAID: { dot: "bg-green-500", bg: "bg-[#ECFDF3]", text: "text-[#15803D]" },
  OVERDUE: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  EXPIRED: { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  CANCELLED: { dot: "bg-stone-400", bg: "bg-stone-100", text: "text-stone-500" },
};

export const TIER_LABELS: Record<string, string> = {
  FREE: "Gratis",
  PRO: "Pro",
  BUSINESS: "Bisnis",
};

// ---- Truncate text ----
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
