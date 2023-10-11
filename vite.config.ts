import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
//@ts-ignore
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  resolve: {
    dedupe: ["three"],
  },
  base: "/kritzeln"
});
