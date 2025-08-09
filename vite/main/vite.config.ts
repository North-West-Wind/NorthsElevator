import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "../../public",
  server: {
    host: '0.0.0.0',
  },
  build: {
		rollupOptions: {
      external: ["three"],
		},
    assetsDir: "./",
    copyPublicDir: false
  }
})