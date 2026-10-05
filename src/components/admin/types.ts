// Tipe & label bersama halaman admin.

export interface AdminStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalUsers: number;
  totalTenants: number;
  totalInvoices: number;
  totalPayments: number;
  recentPayments: Array<{
    id: string;
    orderId: string;
    type: "SUBSCRIPTION" | "INVOICE";
    amount: number;
    createdAt: string;
    tenant: { name: string } | null;
  }>;
  invoiceBreakdown: Array<{ status: string; _count: number }>;
  tierBreakdown: Array<{ tier: string; _count: number }>;
  revenueByMonth: Array<{ month: string; amount: number }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER" | "ADMIN";
  createdAt: string;
  tenant: {
    name: string;
    slug: string;
    subscription: { tier: string } | null;
  };
}

export interface AdminPayment {
  id: string;
  orderId: string;
  type: "SUBSCRIPTION" | "INVOICE";
  status: "PENDING" | "SUCCESS" | "CANCELLED" | "FAILED";
  amount: number;
  tier: string | null;
  interval: string | null;
  transactionId: string | null;
  paymentMethod: string | null;
  createdAt: string;
  tenant: { name: string; slug: string } | null;
  user: { name: string; email: string } | null;
  invoice: { number: string } | null;
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  SUCCESS: "Sukses",
  CANCELLED: "Dibatalkan",
  FAILED: "Failed",
};

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Pemilik",
  MEMBER: "Anggota",
  ADMIN: "Admin",
};

export const ROLE_BADGE: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-800",
  MEMBER: "bg-stone-100 text-stone-700",
  ADMIN: "bg-primary/10 text-primary",
};

export const PAYMENT_STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SUCCESS: "bg-green-100 text-green-800",
  CANCELLED: "bg-stone-100 text-stone-600",
  FAILED: "bg-red-100 text-red-800",
};
