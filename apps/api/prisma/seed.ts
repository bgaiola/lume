import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const org = await prisma.organization.upsert({
    where: { slug: 'lume-demo' },
    update: {},
    create: {
      name: 'Lume Demo',
      slug: 'lume-demo',
      plan: 'PRO',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@lume.app' },
    update: {},
    create: {
      email: 'demo@lume.app',
      name: 'Demo Technician',
      organizationId: org.id,
    },
  });

  // eslint-disable-next-line no-console
  console.warn(`Seeded organization=${org.slug} user=${user.email}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
