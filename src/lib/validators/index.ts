import { z } from "zod";

// ============================================================
// AUTH
// ============================================================

export const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password terlalu panjang"),
  tenantName: z.string().min(2, "Nama bisnis minimal 2 karakter"),
});

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// ============================================================
// CUSTOMER
// ============================================================

export const customerSchema = z.object({
  name: z.string().min(1, "Nama pelanggan wajib diisi"),
  company: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ============================================================
// INVOICE ITEM
// ============================================================

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Deskripsi item wajib diisi"),
  qty: z.coerce.number().min(0.01, "Qty minimal 0.01"),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

// ============================================================
// INVOICE
// ============================================================

export const invoiceSchema = z.object({
  type: z.enum(["INVOICE", "QUOTATION"]).default("INVOICE"),
  customerId: z.string().optional(),
  // Customer fields (for new customer inline)
  customerName: z.string().optional(),
  customerCompany: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerWhatsapp: z.string().optional(),

  issueDate: z.string().min(1, "Tanggal invoice wajib diisi"),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),

  items: z
    .array(invoiceItemSchema)
    .min(1, "Minimal 1 item diperlukan"),

  discountPercent: z.coerce
    .number()
    .min(0)
    .max(100)
    .default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

// ============================================================
// SETTINGS
// ============================================================

export const profileSettingsSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
});

export const companySettingsSchema = z.object({
  tenantName: z.string().min(2, "Nama bisnis minimal 2 karakter"),
  letterheadSignature: z.string().optional(),
});

// ============================================================
// MIDTRANS WEBHOOK
// ============================================================

export const midtransWebhookSchema = z.object({
  order_id: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
  payment_type: z.string().optional(),
  gross_amount: z.string().optional(),
  signature_key: z.string(),
  status_code: z.string(),
  transaction_id: z.string(),
});

export type MidtransWebhookPayload = z.infer<typeof midtransWebhookSchema>;
