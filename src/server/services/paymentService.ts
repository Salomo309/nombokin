import { prisma } from "@/lib/prisma";
import { createSnapTransaction, isPaymentSuccessful } from "@/lib/midtrans";
import { generateShareToken } from "@/lib/utils";
import { sendPaymentConfirmationEmail } from "@/lib/resend";

export async function createPaymentLink(
  invoiceId: string,
  tenantId: string,
  appUrl: string
): Promise<string> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId, isDeleted: false },
    include: { customer: true, items: true, tenant: true },
  });

  if (!invoice) throw new Error("Invoice tidak ditemukan");
  if (invoice.status === "PAID") throw new Error("Invoice sudah lunas");
  if (invoice.status === "CANCELLED") throw new Error("Invoice dibatalkan");

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

  return snapResponse.redirect_url;
}

export async function processPaymentWebhook(payload: {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id: string;
  gross_amount?: string;
}): Promise<void> {
  const { order_id, transaction_status, fraud_status, transaction_id } = payload;

  const isPaid = isPaymentSuccessful(transaction_status, fraud_status);
  if (!isPaid) return;

  // Handle subscription payments
  if (order_id.startsWith("SUB-")) {
    const parts = order_id.split("-");
    const tenantId = parts[1];
    const tier = parts[2] as "PRO" | "BUSINESS";
    const interval = parts[3] as "MONTHLY" | "YEARLY";

    if (!tenantId || !tier || !interval) {
      console.warn(`[Payment Webhook] Invalid subscription order_id format: ${order_id}`);
      return;
    }

    const durationDays = interval === "MONTHLY" ? 30 : 365;
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + durationDays);

    await prisma.subscription.upsert({
      where: { tenantId },
      update: {
        tier,
        status: "ACTIVE",
        currentPeriodEnd,
        midtransSubscriptionId: transaction_id,
      },
      create: {
        tenantId,
        tier,
        status: "ACTIVE",
        currentPeriodEnd,
        midtransSubscriptionId: transaction_id,
      },
    });

    console.log(`[Payment Webhook] Tenant ${tenantId} upgraded to ${tier} (${interval}) until ${currentPeriodEnd.toISOString()}`);
    return;
  }

  // Find invoice by midtrans order ID
  const invoice = await prisma.invoice.findFirst({
    where: { midtransOrderId: order_id, isDeleted: false },
    include: { customer: true, tenant: true },
  });

  if (!invoice) {
    console.warn(`[Payment] Invoice not found for order_id: ${order_id}`);
    return;
  }

  if (invoice.status === "PAID") {
    console.log(`[Payment] Invoice ${invoice.number} already paid — skipping`);
    return;
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
}
