import { defineConfig } from "vitest/config";
import path from "path";

const alias = { "@": path.resolve(__dirname, "./src") };

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    projects: [
      // Pure-function tests — no DB setup needed
      {
        test: {
          name: "unit",
          include: ["tests/lib/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
        resolve: { alias },
      },
      // Integration/DB tests — run prisma push before each test
      {
        test: {
          name: "integration",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/lib/**/*.test.ts"],
          environment: "node",
          globals: true,
          setupFiles: ["./tests/setup.ts"],
        },
        resolve: { alias },
      },
    ],
  },
  resolve: { alias },
});
