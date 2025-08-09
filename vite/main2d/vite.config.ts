import { readFileSync } from "fs";
import { defineConfig } from "vite";

let elevatorSvg = readFileSync("./elevator.svg", "utf8");
// Remove top xml line
elevatorSvg = elevatorSvg.replace(
	/<\?xml .*\?>\n/,
	""
);
// Set correct viewBox
elevatorSvg = elevatorSvg.replace(
	/viewBox="(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (?:-?\d+(?:\.\d+)?) (?:-?\d+(?:\.\d+)?)"/,
	`viewBox="$1 $2 708 285.75"`
);
// Remove width and height of svg
const svgTag = elevatorSvg.match(/<svg(\n\s*[\w:]*=("|').*("|'))*>/);
if (svgTag)
	elevatorSvg = elevatorSvg.replace(svgTag[0], svgTag[0].replaceAll(/(\n)?\s*(width|height)=("|')\d+(\.\d+)?("|')/g, ""));

export default defineConfig({
	publicDir: "../../public",
  server: {
    host: '0.0.0.0',
  },
  build: {
		rollupOptions: {
			input: {
				main2d: "./main2d.html"
			},
		},
    assetsDir: "./",
		copyPublicDir: false
  },
	plugins: [
		{
			name: "fill-svg",
			transformIndexHtml(html) {
				return html.replace("${elevator}", elevatorSvg);
			}
		}
	]
});