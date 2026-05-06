import * as path from "path";
import { app } from "..";
import sirv from "sirv";

app.use("/", sirv("./uop-editor/dist", { extensions: [] }));

app.get("/uop-editor", (_req, res) => {
	res.sendFile("index.html", { root: path.resolve(__dirname, "../../uop-editor/dist") });
});