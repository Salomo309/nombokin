const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@nombokin.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[Resend] RESEND_API_KEY tidak diset — email tidak dikirim.");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Resend] Failed to send email: ${error}`);
    }
  } catch (err) {
    console.error("[Resend] Error kirim email:", err);
  }
}

// ---- Email templates ----

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: "Verifikasi Alamat Email — Nombokin",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #FAF7F2;">
        <h1 style="color: #1C1917; font-size: 24px; margin-bottom: 8px;">Verifikasi Email Anda</h1>
        <p style="color: #57534E;">Halo <strong>${opts.name}</strong>, terima kasih sudah mendaftar di Nombokin.</p>
        <p style="color: #57534E;">Silakan klik tombol di bawah untuk memverifikasi alamat email Anda:</p>
        <a href="${opts.verifyUrl}" style="display: inline-block; background: #C2410C; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 16px 0;">Verifikasi Email</a>
        <p style="color: #A8A29E; font-size: 13px;">Link ini berlaku selama 24 jam. Jika Anda tidak mendaftar di Nombokin, abaikan email ini.</p>
        <p style="color: #A8A29E; font-size: 13px;">Email ini dikirim otomatis oleh Nombokin.</p>
      </div>
    `,
  });
}

export async function sendPaymentConfirmationEmail(opts: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: string;
  tenantName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Pembayaran Diterima — ${opts.invoiceNumber}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #FAF7F2;">
        <h1 style="color: #1C1917; font-size: 24px; margin-bottom: 8px;">Pembayaran Berhasil ✓</h1>
        <p style="color: #57534E;">Invoice <strong>${opts.invoiceNumber}</strong> dari <strong>${opts.tenantName}</strong> telah dibayar.</p>
        <div style="background: #fff; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #E7E5E4;">
          <p style="margin: 0; color: #57534E;">Nama: <strong>${opts.customerName}</strong></p>
          <p style="margin: 8px 0 0; color: #57534E;">Jumlah: <strong style="color: #15803D;">${opts.amount}</strong></p>
        </div>
        <p style="color: #A8A29E; font-size: 13px;">Email ini dikirim otomatis oleh Nombokin.</p>
      </div>
    `,
  });
}

export async function sendPasswordChangedEmail(opts: {
  to: string;
  customerName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: "Your Account Password Has Been Changed",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #FAF7F2;">
        <h1 style="color: #1C1917; font-size: 24px; margin-bottom: 8px;">Password Changed ✓</h1>
        <p style="color: #57534E;">Dear <strong>${opts.customerName}</strong>,</p>
        <p style="color: #57534E;">Your Nombokin account password has just been changed successfully.</p>
        <p style="color: #57534E;">If you did not make this change, please contact support and secure your account immediately.</p>
        <p style="color: #A8A29E; font-size: 13px; margin-top: 24px;">This email was sent automatically by Nombokin.</p>
      </div>
    `,
  });
}

export async function sendOverdueReminderEmail(opts: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  shareLink: string;
  tenantName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Pengingat: Invoice ${opts.invoiceNumber} Telah Jatuh Tempo`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #FAF7F2;">
        <h1 style="color: #1C1917; font-size: 24px; margin-bottom: 8px;">Pengingat Pembayaran</h1>
        <p style="color: #57534E;">Yth. <strong>${opts.customerName}</strong>,</p>
        <p style="color: #57534E;">Invoice <strong>${opts.invoiceNumber}</strong> dari <strong>${opts.tenantName}</strong> telah jatuh tempo pada ${opts.dueDate}.</p>
        <div style="background: #fff; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #E7E5E4;">
          <p style="margin: 0; color: #57534E;">Jumlah: <strong style="color: #B91C1C;">${opts.amount}</strong></p>
        </div>
        <a href="${opts.shareLink}" style="display: inline-block; background: #C2410C; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">Bayar Sekarang</a>
        <p style="color: #A8A29E; font-size: 13px; margin-top: 24px;">Email ini dikirim otomatis oleh Nombokin.</p>
      </div>
    `,
  });
}
