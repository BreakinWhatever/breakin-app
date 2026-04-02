import { beforeEach } from "vitest";
import { execSync } from "child_process";

beforeEach(() => {
  execSync("npx prisma db push --force-reset", {
    env: {
      ...process.env,
      DATABASE_URL: "file:./test.db",
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
    },
  });
});
