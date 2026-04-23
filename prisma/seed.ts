import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { FALLBACK_EXAMPLES } from "../src/lib/example-prompts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@astra.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123456";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      passwordHash: adminHash,
    },
    create: {
      name: "Admin Astra",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
      termsAcceptedAt: new Date(),
    },
  });
  console.log(`Admin seeded: ${admin.email} (senha: ${adminPassword})`);

  const sampleUsers = [
    { name: "Otavio Pereira", email: "otavio.pereira@astra-sa.com" },
    { name: "Ana Souza", email: "ana.souza@astra-sa.com" },
    { name: "Rafael Lima", email: "rafael.lima@astra-sa.com" },
  ];

  for (const u of sampleUsers) {
    const passwordHash = await bcrypt.hash("imaginai123", 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: "USER",
        termsAcceptedAt: new Date(),
      },
    });
    const exists = await prisma.conversation.findFirst({ where: { userId: user.id } });
    if (!exists) {
      await prisma.conversation.create({
        data: {
          userId: user.id,
          title: "Escorredor minimalista",
          messages: {
            create: [
              {
                role: "USER",
                content: "Escorredor de louça minimalista em aço preto.",
              },
              {
                role: "ASSISTANT",
                content: "Aqui está sua imagem!",
                imagePrompt: "Escorredor de louça minimalista em aço preto.",
                imageUrl: FALLBACK_EXAMPLES[1].imageUrl,
              },
            ],
          },
        },
      });
    }
  }

  // Seed example prompts that appear on the landing page gallery.
  for (const ex of FALLBACK_EXAMPLES) {
    await prisma.examplePrompt.upsert({
      where: { id: ex.id },
      update: { prompt: ex.prompt, imageUrl: ex.imageUrl },
      create: { id: ex.id, prompt: ex.prompt, imageUrl: ex.imageUrl },
    });
  }
  console.log(`Seeded ${FALLBACK_EXAMPLES.length} example prompts.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
