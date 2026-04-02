import { beforeEach } from "vitest";
import { execSync } from "child_process";

beforeEach(() => {
  execSync("npx prisma db push --force-reset --skip-generate", {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
});
