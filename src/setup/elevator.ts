import * as fs from "fs";
import { isbot } from "isbot";
import * as path from "path";
import { app } from "..";
import { Cached } from "../cache";

const root = path.resolve(__dirname, "../../public");
const PAGES = new Map(fs.readdirSync(path.join(root, "contents")).filter(file => file.endsWith(".html")).map(file => {
	const split = file.slice(0, -5).split("-");
	return [split.join("-"), new Cached(Infinity, () => fs.readFileSync(path.join(root, "contents", file), { encoding: "utf8" }))]
}));
const TEMPLATE = new Cached(Infinity, () => {
	let template = fs.readFileSync(path.join(root, "contents/templates/seo.html"), { encoding: "utf8" });
	for (const [key, value] of Object.entries(SEO_CONFIG)) template = template.replace(new RegExp(`\\{${key}\\}`, "g"), value);
	return template;
});
const SEO_CONFIG = {
	title: "NorthWestWind's Elevator",
	description: `The really cool home page of NorthWestWind!
	Made with THREE.JS
	World record of most impractical homepage`,
	url: "https://northwestw.in",
	image: "/assets/images/screenshot.png",
	author: "NorthWestWind",
	twitterCreator: "@NorthWestWindNW"
};
const API_CONFIG = new Cached(1800000, () => ({
	pfps: fs.readdirSync(path.join(root, "assets/pfps"), { withFileTypes: true }).filter(ent => ent.isFile()).map(ent => ent.name),
	info: fs.readdirSync(path.join(root, "contents/info-center"))
}));

app.get("/api/config", (_req, res) => {
	res.json(API_CONFIG.get());
});

app.get("/2d/:page?", (req, res) => {
	res.redirect(301, `/${req.params.page || ""}?flat`);
});
app.get("/:page?", (req, res) => {
	if (isbot(req.get("user-agent"))) {
		// create page using seo template
		let template = TEMPLATE.get();
		const firstKey = Array.from(PAGES.keys()).sort()[0];
		let content = PAGES.get(firstKey)!.get();
		if (PAGES.has(req.params.page || ""))
			content = PAGES.get(req.params.page!)!.get();
		template = template.replace("{content}", content);
		res.send(template);
	} else res.sendFile("index.html", { root: path.resolve(__dirname, "../../vite/main/dist") });
});