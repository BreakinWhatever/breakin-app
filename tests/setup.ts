import { beforeEach } from "vitest";
import { execSync } from "child_process";

beforeEach(() => {
  try {
    execSync("npx prisma db push --force-reset", {
      env: {
        ...process.env,
        DATABASE_URL: "file:./test.db",
        PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes",
      },
    });
  } catch {
    // No-op: pure unit tests do not require a database.
    // Integration tests should run with a valid DATABASE_URL.
  }
});
