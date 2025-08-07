/** @type {import('vite').UserConfig} */
export default {
	publicDir: "../../public",
  server: {
    host: '0.0.0.0',
  },
  build: {
		rollupOptions: {
			input: {
				main2d: "./main2d.html"
			}
		},
    assetsDir: "./",
		copyPublicDir: false
  }
}