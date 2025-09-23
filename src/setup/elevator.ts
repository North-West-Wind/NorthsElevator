import * as fs from "fs";
import { isbot } from "isbot";
import * as path from "path";
import { app } from "..";

const root = path.resolve(__dirname, "../../public");
const PAGES = new Map(fs.readdirSync(path.join(root, "contents")).filter(file => file.endsWith(".html")).map(file => {
	const split = file.slice(0, -5).split("-");
	const num = parseInt(split.shift()!);
	return [split.join("-"), num]
}));
const SEO_CONFIG = {
	title: "North's Elevator",
	description: `The really cool home page of NorthWestWind!
	Made with THREE.JS
	World record of most impractical homepage`,
	url: "https://www.northwestw.in",
	image: "/assets/images/screenshot.png",
	author: "NorthWestWind",
	twitterCreator: "@NorthWestWindNW"
};

app.get("/api/config", (_req, res) => {
	res.json({
		pfps: fs.readdirSync(path.join(root, "assets/pfps"), { withFileTypes: true }).filter(ent => ent.isFile()).map(ent => ent.name),
		info: fs.readdirSync(path.join(root, "contents/info-center"))
	});
});

app.get("/2d/:page?", (req, res) => {
	res.redirect(301, `/${req.params.page || ""}?flat`);
});
app.get("/:page?", (req, res) => {
	if (isbot(req.get("user-agent"))) {
		// create page using seo template
		let template = fs.readFileSync(path.join(root, "contents/templates/seo.html"), { encoding: "utf8" });
		for (const [key, value] of Object.entries(SEO_CONFIG)) template = template.replace(new RegExp(`\\{${key}\\}`, "g"), value);
		let filename = "0-ground.html";
		if (PAGES.has(req.params.page || "")) {
			const page = PAGES.get(req.params.page!);
			filename = `${page}-${req.params.page}.html`;
		}
		const content = fs.readFileSync(path.join(root, "contents", filename), { encoding: "utf8" });
		template = template.replace("{content}", content);
		res.send(template);
	} else res.sendFile("index.html", { root: path.resolve(__dirname, "../../vite/main/dist") });
});