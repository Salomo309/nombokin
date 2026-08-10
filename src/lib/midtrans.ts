import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_MERCHANT_ID = process.env.MIDTRANS_MERCHANT_ID ?? "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

const BASE_URL = IS_PRODUCTION
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

const SNAP_BASE_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

export interface MidtransTransaction {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail?: string;
  invoiceNumber: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

// ---- Create Snap transaction ----

export async function createSnapTransaction(
  transaction: MidtransTransaction
): Promise<MidtransSnapResponse> {
  const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

  const body = {
    transaction_details: {
      order_id: transaction.orderId,
      gross_amount: Math.round(transaction.grossAmount),
    },
    customer_details: {
      first_name: transaction.customerName,
      email: transaction.customerEmail ?? undefined,
    },
    item_details: transaction.items.map((item) => ({
      id: item.id,
      name: item.name.slice(0, 50), // Midtrans max 50 chars
      price: Math.round(item.price),
      quantity: item.quantity,
    })),
    enabled_payments: [
      "credit_card",
      "bca_va",
      "bni_va",
      "bri_va",
      "mandiri_va",
      "permata_va",
      "other_va",
      "gopay",
      "shopeepay",
      "qris",
    ],
    credit_card: {
      secure: true,
    },
  };

  const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Midtrans error: ${response.status} ${error}`);
  }

  return response.json() as Promise<MidtransSnapResponse>;
}

// ---- Verify webhook signature ----

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const serverKey = MIDTRANS_SERVER_KEY;
  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  return expected === signatureKey;
}

// ---- Check if payment is successful ----

export function isPaymentSuccessful(
  transactionStatus: string,
  fraudStatus?: string
): boolean {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" || !fraudStatus;
  }
  return transactionStatus === "settlement";
}

export { MIDTRANS_CLIENT_KEY, IS_PRODUCTION };
