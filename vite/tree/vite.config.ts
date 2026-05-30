import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "../../public",
  build: {
    assetsDir: "./",
    copyPublicDir: false
  }
})