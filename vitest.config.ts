import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    env: { DATABASE_URL: "file:./data/test.db" },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
