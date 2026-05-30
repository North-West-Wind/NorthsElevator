import * as path from "path";
import { app } from "..";
import sirv from "sirv";

app.use("/", sirv("./vite/tree/dist", { extensions: [] }));

app.get("/tree", (_req, res) => {
	res.sendFile("index.html", { root: path.resolve(__dirname, "../../vite/tree/dist") });
});

app.get("/portal", (_req, res) => {
	res.redirect("/tree");
});