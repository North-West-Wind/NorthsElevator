import * as path from "path";
import { app } from "..";

app.get("/uop-editor", (_req, res) => {
	res.sendFile("index.html", { root: path.resolve(__dirname, "../../uop-editor/dist") });
});