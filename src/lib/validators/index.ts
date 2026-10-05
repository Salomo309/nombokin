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
// PAYMENT METHOD (manual bank transfer / custom QRIS)
// ============================================================

export const paymentMethodSchema = z
  .object({
    type: z.enum(["BANK_TRANSFER", "CUSTOM_QRIS"]),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
    qrisImageUrl: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "BANK_TRANSFER") {
      if (!d.bankName)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required", path: ["bankName"] });
      if (!d.accountNumber)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number is required", path: ["accountNumber"] });
      if (!d.accountHolder)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account holder is required", path: ["accountHolder"] });
    }
    if (d.type === "CUSTOM_QRIS" && !d.qrisImageUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "QRIS image is required", path: ["qrisImageUrl"] });
    }
  });

export const paymentMethodPatchSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
  qrisImageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().optional(),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

// ============================================================
// TEAM (multi-user undangan)
// ============================================================

export const teamAcceptSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});

export const teamRoleSchema = z.object({
  role: z.enum(["OWNER", "MEMBER"]),
});

export type TeamAcceptInput = z.infer<typeof teamAcceptSchema>;

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
