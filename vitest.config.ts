import { defineConfig } from "vitest/config";
import path from "path";

const alias = { "@": path.resolve(__dirname, "./src") };

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/lib/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
        resolve: { alias },
      },
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
});
