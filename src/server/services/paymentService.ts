import { prisma } from "@/lib/prisma";
import { createSnapTransaction, getTransactionStatus, isPaymentSuccessful } from "@/lib/midtrans";
import { generateShareToken } from "@/lib/utils";
import { sendPaymentConfirmationEmail } from "@/lib/resend";
import { redisDel } from "@/server/redis";
import { handleTenantRestore } from "@/server/services/subscriptionService";

async function invalidatePaymentCaches(tenantId: string): Promise<void> {
  await Promise.all([
    redisDel(`nombokin:payments:${tenantId}`),
    redisDel("nombokin:admin:dashboard"),
  ]);
}

export async function createPaymentLink(
  invoiceId: string,
  tenantId: string,
  appUrl: string
): Promise<string> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, isDeleted: false },
    include: { customer: true, items: true, tenant: true },
  });

  if (!invoice) throw new Error("Invoice not found");
  if (invoice.type !== "INVOICE") throw new Error("Only invoices can be paid online");
  if (invoice.status === "PAID") throw new Error("Invoice is already paid");
  if (invoice.status === "CANCELLED") throw new Error("Invoice is cancelled");

  // Generate unique order ID if not set
  const orderId =
    invoice.midtransOrderId ?? `NMB-${invoice.number}-${generateShareToken().slice(0, 8)}`;

  const total = parseFloat(invoice.total.toString());

  const snapResponse = await createSnapTransaction({
    orderId,
    grossAmount: total,
    customerName: invoice.customer?.name ?? "Customer",
    customerEmail: invoice.customer?.email ?? undefined,
    invoiceNumber: invoice.number,
    items: invoice.items.map((item) => ({
      id: item.id,
      name: item.description.slice(0, 50),
      price: Math.round(parseFloat(item.unitPrice.toString())),
      quantity: Math.round(parseFloat(item.qty.toString())),
    })),
  });

  // Store order ID and payment URL
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      midtransOrderId: orderId,
      midtransPaymentUrl: snapResponse.redirect_url,
    },
  });

  // Record pending payment in history
  await prisma.payment.upsert({
    where: { orderId },
    update: {
      status: "PENDING",
      amount: total,
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
    },
    create: {
      orderId,
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      type: "INVOICE",
      status: "PENDING",
      amount: total,
      description: `Pembayaran ${invoice.number}`,
    },
  });

  return snapResponse.redirect_url;
}

export async function handlePaidSubscriptionOrder(data: {
  orderId: string;
  transactionId: string;
  grossAmount?: string;
}): Promise<void> {
  const { orderId, transactionId } = data;

  // Format: SUB-{tier}-{M|Y}-{tenantId}-{token}
  const parts = orderId.split("-");
  const tier = parts[1] as "PRO" | "BUSINESS";
  const intervalRaw = parts[2];
  const tenantId = parts[3];

  if (!tenantId || !tier || !intervalRaw) {
    console.warn(`[Payment] Invalid subscription order_id format: ${orderId}`);
    return;
  }

  const interval = intervalRaw === "Y" ? "YEARLY" : "MONTHLY";
  const durationDays = interval === "MONTHLY" ? 30 : 365;
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + durationDays);

  await prisma.subscription.upsert({
    where: { tenantId },
    update: {
      tier,
      status: "ACTIVE",
      currentPeriodEnd,
      midtransSubscriptionId: transactionId,
    },
    create: {
      tenantId,
      tier,
      status: "ACTIVE",
      currentPeriodEnd,
      midtransSubscriptionId: transactionId,
    },
  });

  await prisma.payment.upsert({
    where: { orderId },
    update: {
      status: "SUCCESS",
      transactionId,
    },
    create: {
      orderId,
      tenantId,
      type: "SUBSCRIPTION",
      status: "SUCCESS",
      amount: parseFloat(data.grossAmount ?? "0") || 0,
      tier,
      interval,
      transactionId,
      description: `Langganan ${tier} (${interval})`,
    },
  });

  console.log(`[Payment] Tenant ${tenantId} upgraded to ${tier} (${interval}) until ${currentPeriodEnd.toISOString()}`);
  await invalidatePaymentCaches(tenantId);

  // Re-upgrade ke BISNIS memulihkan anggota yang dibekukan saat downgrade
  if (tier === "BUSINESS") {
    await handleTenantRestore(tenantId);
  }
}

export async function handlePaidInvoiceOrder(data: {
  orderId: string;
  transactionId: string;
}): Promise<{ updated: boolean }> {
  const { orderId, transactionId } = data;

  // Find invoice by midtrans order ID
  const invoice = await prisma.invoice.findFirst({
    where: { midtransOrderId: orderId, isDeleted: false },
    include: { customer: true, tenant: true },
  });

  if (!invoice) {
    console.warn(`[Payment] Invoice not found for order_id: ${orderId}`);
    return { updated: false };
  }

  // Record successful invoice payment
  await prisma.payment.upsert({
    where: { orderId },
    update: {
      status: "SUCCESS",
      transactionId,
      amount: parseFloat(invoice.total.toString()),
    },
    create: {
      orderId,
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      type: "INVOICE",
      status: "SUCCESS",
      amount: parseFloat(invoice.total.toString()),
      transactionId,
      description: `Pembayaran ${invoice.number}`,
    },
  });

  if (invoice.status === "PAID") {
    console.log(`[Payment] Invoice ${invoice.number} already paid — skipping`);
    return { updated: false };
  }

  // Mark as paid
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  console.log(`[Payment] Invoice ${invoice.number} marked as PAID`);
  await invalidatePaymentCaches(invoice.tenantId);

  // Send confirmation email
  if (invoice.customer?.email) {
    await sendPaymentConfirmationEmail({
      to: invoice.customer.email,
      customerName: invoice.customer.name,
      invoiceNumber: invoice.number,
      amount: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(parseFloat(invoice.total.toString())),
      tenantName: invoice.tenant.name,
    });
  }

  return { updated: true };
}

// Inti bersama untuk aktivasi manual: tanya status ke Midtrans, aktifkan bila lunas.
// Dipakai POST /api/billing/confirm (SUB-*) dan POST /api/invoices/[id]/check-status.
// Webhook tetap lewat processPaymentWebhook (tidak perlu query ulang).
export async function confirmMidtransOrder(
  orderId: string
): Promise<{ paid: boolean; status?: string }> {
  const status = await getTransactionStatus(orderId);

  if (!isPaymentSuccessful(status.transaction_status, status.fraud_status)) {
    return { paid: false, status: status.transaction_status };
  }

  if (orderId.startsWith("SUB-")) {
    await handlePaidSubscriptionOrder({
      orderId,
      transactionId: status.transaction_id,
      grossAmount: status.gross_amount,
    });
  } else {
    await handlePaidInvoiceOrder({
      orderId,
      transactionId: status.transaction_id,
    });
  }

  return { paid: true };
}

export async function processPaymentWebhook(payload: {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id: string;
  gross_amount?: string;
}): Promise<void> {
  const { order_id, transaction_status, fraud_status, transaction_id, gross_amount } = payload;

  const isPaid = isPaymentSuccessful(transaction_status, fraud_status);
  if (!isPaid) return;

  // Handle subscription payments
  if (order_id.startsWith("SUB-")) {
    await handlePaidSubscriptionOrder({
      orderId: order_id,
      transactionId: transaction_id,
      grossAmount: gross_amount,
    });
    return;
  }

  await handlePaidInvoiceOrder({
    orderId: order_id,
    transactionId: transaction_id,
  });
}
