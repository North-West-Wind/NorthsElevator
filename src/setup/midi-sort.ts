import * as path from "path";
import { app } from "..";
import sirv from "sirv";

app.use("/", sirv("./midi-sort/dist", { extensions: [] }));

app.get("/midi-sort", (_req, res) => {
	res.sendFile("index.html", { root: path.resolve(__dirname, "../../midi-sort/dist") });
});