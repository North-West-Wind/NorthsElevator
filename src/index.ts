import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { isbot } from "isbot";
import compression from "compression";
import sirv from "sirv";

const root = path.resolve(__dirname, "../public");
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

const app = express();

app.use(compression());
app.use("/", sirv("./public", { extensions: [] }));
app.use("/", sirv("./vite/main2d/dist", { extensions: [] }));
app.use("/", sirv("./vite/main/dist", { extensions: [] }));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.resolve(__dirname, "../views"));
app.set('view engine', 'ejs');

app.get("/api/ping", (_req, res) => res.sendStatus(200));
app.get("/api/config", (_req, res) => {
	res.json({
		pfps: fs.readdirSync(path.join(root, "assets/pfps"), { withFileTypes: true }).filter(ent => ent.isFile()).map(ent => ent.name),
		info: fs.readdirSync(path.join(root, "contents/info-center"))
	});
});

// tradew1nd bot stuff
app.get("/api/download/:guild", async (req, res) => {
	const response = await fetch("http://localhost:3001/download/" + req.params.guild);
	if (!response.ok) res.sendStatus(response.status);
	else res.json(await response.json());
});

app.get("/tradew1nd/download/:guild", async (req, res) => {
	res.render("tradew1nd/downloads", { guild: req.params.guild });
});

app.get("/tradew1nd/invite", async (req, res) => {
	res.render("tradew1nd/invite");
});

app.get("/tradew1nd/invite/real", async (req, res) => {
	try {
		const response = await fetch(`http://localhost:3001/`);
		if (!response.ok) res.sendStatus(response.status);
		else {
			const data = <any>await response.json();
			for (const bot of data) {
				if (bot.size < 75) return res.redirect(301, `https://discord.com/api/oauth2/authorize?client_id=${bot.id}&permissions=2150755392&scope=bot%20applications.commands`);
			}
			res.send("All TradeW1nd derivatives are full!");
		}
	} catch (err) {
		if (!res.headersSent) res.sendStatus(500);
	}
});

app.get("/tradew1nd/privacy", (_req, res) => res.render("tradew1nd/privacy"));
app.get("/tradew1nd", (_req, res) => res.render("tradew1nd/index"));
// redirectors
app.get("/matrix", (_req, res) => res.redirect(301, "https://matrix.to/#/#northwestwind:matrix.northwestw.in"));
app.get("/portal", (_req, res) => res.render("portal"));

// uop editor
app.get("/uop-editor", (req, res) => {
	res.sendFile("uop-editor.html", { root });
});

// elevator
app.get("/2d/:page?", (req, res, next) => {
	if (isbot(req.get("user-agent")) || !PAGES.has(req.params.page || "ground")) next();
	else res.sendFile("main2d.html", { root: path.resolve(__dirname, "../vite/main2d/dist") });
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
	} else res.sendFile("main.html", { root: path.resolve(__dirname, "../vite/main/dist") });
});

const server = app.listen(process.env.PORT || 3000, async () => {
	const info = <any>server.address();
	const port = info.port;
	console.log('North Central listening at port %s', port);
});
