import { app } from "..";

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