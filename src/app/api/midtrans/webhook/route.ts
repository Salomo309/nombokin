import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { processPaymentWebhook } from "@/server/services/paymentService";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const orderId = payload.order_id;
    const statusCode = payload.status_code;
    const grossAmount = payload.gross_amount;
    const signatureKey = payload.signature_key;
    const transactionId = payload.transaction_id;

    if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionId) {
      return NextResponse.json({ error: "Payload tidak lengkap" }, { status: 400 });
    }

    // 1. Verifikasi tanda tangan Midtrans
    const isValidSignature = verifyMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      signatureKey
    );

    if (!isValidSignature) {
      console.warn(`[Midtrans Webhook] Tanda tangan tidak valid untuk order: ${orderId}`);
      return NextResponse.json({ error: "Tanda tangan tidak valid" }, { status: 401 });
    }

    // 2. Cek idempotensi menggunakan WebhookEvent table
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: transactionId },
    });

    if (existingEvent) {
      console.log(`[Midtrans Webhook] Event ID ${transactionId} sudah diproses (Idempotent)`);
      return NextResponse.json({ message: "Sudah diproses" }, { status: 200 });
    }

    // Simpan event ke database untuk mencegah double-processing
    await prisma.webhookEvent.create({
      data: {
        provider: "MIDTRANS",
        eventId: transactionId,
        payload: payload,
      },
    });

    // 3. Proses status transaksi (Lunas / Sukses)
    await processPaymentWebhook({
      order_id: orderId,
      transaction_status: payload.transaction_status,
      fraud_status: payload.fraud_status,
      transaction_id: transactionId,
      gross_amount: grossAmount,
    });

    return NextResponse.json({ success: true, message: "Webhook berhasil diproses" }, { status: 200 });
  } catch (err) {
    console.error("[Midtrans Webhook Error]", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
