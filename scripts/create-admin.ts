import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@nombokin.com";
  const name = process.env.ADMIN_NAME ?? "Admin Nombokin";
  const password =
    process.env.ADMIN_PASSWORD ??
    (() => {
      if (process.env.ADMIN_PASSWORD === "") return "";
      return randomBytes(9).toString("base64url");
    })();
  const tenantSlug = process.env.ADMIN_TENANT_SLUG ?? "nombokin-admin";

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 12),
        emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });
    console.log(`✅ Admin updated: ${updated.email} (role=${updated.role})`);
  } else {
    let slug = tenantSlug;
    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${tenantSlug}-${Date.now().toString(36)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: "Nombokin Admin", slug },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          passwordHash: await bcrypt.hash(password, 12),
          role: "ADMIN",
          emailVerifiedAt: new Date(),
        },
      });

      await tx.subscription.create({
        data: { tenantId: tenant.id, tier: "BUSINESS", status: "ACTIVE" },
      });

      return { user };
    });

    console.log(`✅ Admin created: ${result.user.email} (role=${result.user.role})`);
  }

  console.log("");
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Name    : ${name}`);
}

main()
  .catch((e) => {
    console.error("❌ Gagal membuat admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
