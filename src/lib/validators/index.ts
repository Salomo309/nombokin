import { z } from "zod";

// ============================================================
// AUTH
// ============================================================

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"],
  });

// ============================================================
// CUSTOMER
// ============================================================
export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ============================================================
// PRODUCT
// ============================================================

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
});

export type ProductInput = z.infer<typeof productSchema>;

// ============================================================
// INVOICE ITEM
// ============================================================

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Item description is required"),
  qty: z.coerce.number().min(0.01, "Quantity must be at least 0.01"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
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

  issueDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),

  items: z
    .array(invoiceItemSchema)
    .min(1, "At least 1 item is required"),

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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});

export const companySettingsSchema = z.object({
  tenantName: z.string().min(2, "Business name must be at least 2 characters"),
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
