import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seed database Nombokin...");

  // Clean up existing seed data
  await prisma.webhookEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ============================================================
  // TENANT 1: Studio Raka (Designer Freelance)
  // ============================================================
  const tenantRaka = await prisma.tenant.create({
    data: {
      name: "Studio Raka",
      slug: "studio-raka",
      watermarkText: "Dibuat dengan Nombokin",
    },
  });

  const userRaka = await prisma.user.create({
    data: {
      tenantId: tenantRaka.id,
      email: "raka@studioraka.id",
      name: "Raka Pratama",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenantRaka.id,
      tier: "FREE",
      status: "ACTIVE",
    },
  });

  // Customers for Studio Raka
  const customerNusantara = await prisma.customer.create({
    data: {
      tenantId: tenantRaka.id,
      name: "Budi Santoso",
      company: "CV Nusantara Kreatif",
      email: "budi@nusantarakreatif.co.id",
      whatsapp: "6281234567890",
      notes: "Klien reguler, pembayaran tepat waktu",
    },
  });

  const customerMaju = await prisma.customer.create({
    data: {
      tenantId: tenantRaka.id,
      name: "Dewi Rahayu",
      company: "PT Maju Bersama Digital",
      email: "dewi@majubersama.com",
      whatsapp: "6282345678901",
    },
  });

  const customerSari = await prisma.customer.create({
    data: {
      tenantId: tenantRaka.id,
      name: "Sari Indah",
      company: "Toko Online Sari",
      email: "sari@tokosari.id",
      whatsapp: "6283456789012",
    },
  });

  // Invoices for Studio Raka
  await prisma.invoice.create({
    data: {
      tenantId: tenantRaka.id,
      customerId: customerNusantara.id,
      number: "INV-2026-0001",
      type: "INVOICE",
      status: "PAID",
      issueDate: new Date("2026-07-01"),
      dueDate: new Date("2026-07-15"),
      subtotal: 5500000,
      discountPercent: 0,
      taxPercent: 11,
      total: 6105000,
      currency: "IDR",
      notes: "Terima kasih atas kepercayaan Anda.",
      terms: "Pembayaran dalam 14 hari setelah invoice diterima.",
      shareToken: "inv-raka-001-share",
      paidAt: new Date("2026-07-10"),
      items: {
        create: [
          {
            description: "Desain Logo & Brand Identity",
            qty: 1,
            unitPrice: 3500000,
            total: 3500000,
            sortOrder: 0,
          },
          {
            description: "Desain Kartu Nama (2 sisi)",
            qty: 2,
            unitPrice: 500000,
            total: 1000000,
            sortOrder: 1,
          },
          {
            description: "Desain Kop Surat & Amplop",
            qty: 1,
            unitPrice: 1000000,
            total: 1000000,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      tenantId: tenantRaka.id,
      customerId: customerMaju.id,
      number: "INV-2026-0002",
      type: "INVOICE",
      status: "SENT",
      issueDate: new Date("2026-07-20"),
      dueDate: new Date("2026-08-03"),
      subtotal: 8000000,
      discountPercent: 10,
      taxPercent: 11,
      total: 7992000,
      currency: "IDR",
      notes: "Diskon 10% untuk klien baru.",
      terms: "Pembayaran 50% di muka, 50% setelah revisi final.",
      shareToken: "inv-raka-002-share",
      items: {
        create: [
          {
            description: "Desain UI/UX Landing Page (5 halaman)",
            qty: 1,
            unitPrice: 5000000,
            total: 5000000,
            sortOrder: 0,
          },
          {
            description: "Desain Banner Media Sosial (10 template)",
            qty: 1,
            unitPrice: 2000000,
            total: 2000000,
            sortOrder: 1,
          },
          {
            description: "Revisi (2x)",
            qty: 1,
            unitPrice: 1000000,
            total: 1000000,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      tenantId: tenantRaka.id,
      customerId: customerSari.id,
      number: "QUO-2026-0001",
      type: "QUOTATION",
      status: "DRAFT",
      issueDate: new Date("2026-08-01"),
      dueDate: new Date("2026-08-31"),
      subtotal: 3200000,
      discountPercent: 0,
      taxPercent: 0,
      total: 3200000,
      currency: "IDR",
      notes: "Penawaran ini berlaku selama 30 hari.",
      shareToken: "quo-raka-001-share",
      items: {
        create: [
          {
            description: "Desain Feed Instagram (12 konten/bulan)",
            qty: 1,
            unitPrice: 2000000,
            total: 2000000,
            sortOrder: 0,
          },
          {
            description: "Story Instagram (8 template)",
            qty: 1,
            unitPrice: 800000,
            total: 800000,
            sortOrder: 1,
          },
          {
            description: "Highlight Cover (5 buah)",
            qty: 1,
            unitPrice: 400000,
            total: 400000,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      tenantId: tenantRaka.id,
      customerId: customerNusantara.id,
      number: "INV-2026-0003",
      type: "INVOICE",
      status: "OVERDUE",
      issueDate: new Date("2026-06-15"),
      dueDate: new Date("2026-06-30"),
      subtotal: 4500000,
      discountPercent: 0,
      taxPercent: 11,
      total: 4995000,
      currency: "IDR",
      shareToken: "inv-raka-003-share",
      items: {
        create: [
          {
            description: "Redesign Website Company Profile",
            qty: 1,
            unitPrice: 4500000,
            total: 4500000,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  // ============================================================
  // TENANT 2: Agensi Kata (Copywriter)
  // ============================================================
  const tenantKata = await prisma.tenant.create({
    data: {
      name: "Agensi Kata",
      slug: "agensi-kata",
      watermarkText: "Dibuat dengan Nombokin",
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenantKata.id,
      email: "maya@agensikata.id",
      name: "Maya Sari",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "OWNER",
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenantKata.id,
      tier: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: new Date("2027-01-01"),
    },
  });

  console.log("✅ Seed selesai!");
  console.log("");
  console.log("👤 Akun test:");
  console.log("   Email: raka@studioraka.id | Password: password123");
  console.log("   Email: maya@agensikata.id | Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
