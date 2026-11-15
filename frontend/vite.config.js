import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/smartspend-ai-personal-expense-tracker/",
  server: {
    port: 5173
  }
});