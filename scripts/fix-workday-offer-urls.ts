import "dotenv/config";
import { prisma } from "../src/lib/db";
import { normalizeWorkdayJobUrl } from "../src/lib/crawler/workday";

async function main() {
  const dryRun = !process.argv.includes("--apply");

  const workdayOffers = await prisma.jobOffer.findMany({
    where: {
      url: {
        contains: "myworkdayjobs.com",
      },
    },
    select: {
      id: true,
      url: true,
      company: true,
      title: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const updates: Array<{ id: string; from: string; to: string; title: string; company: string }> = [];
  const collisions: Array<{ id: string; existingId: string; to: string }> = [];

  for (const offer of workdayOffers) {
    const correctedUrl = normalizeWorkdayJobUrl(offer.url);
    if (!correctedUrl || correctedUrl === offer.url) continue;

    const existing = await prisma.jobOffer.findFirst({
      where: {
        url: correctedUrl,
        NOT: { id: offer.id },
      },
      select: { id: true },
    });

    if (existing) {
      collisions.push({
        id: offer.id,
        existingId: existing.id,
        to: correctedUrl,
      });
      continue;
    }

    updates.push({
      id: offer.id,
      from: offer.url,
      to: correctedUrl,
      title: offer.title,
      company: offer.company,
    });
  }

  if (!dryRun) {
    for (const update of updates) {
      await prisma.jobOffer.update({
        where: { id: update.id },
        data: { url: update.to },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned: workdayOffers.length,
        updates: updates.length,
        collisions: collisions.length,
        sample: updates.slice(0, 10),
      },
      null,
      2
    )
  );

  if (collisions.length > 0) {
    console.log(
      JSON.stringify(
        {
          collisions: collisions.slice(0, 10),
        },
        null,
        2
      )
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
