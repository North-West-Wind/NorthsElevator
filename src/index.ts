import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import * as path from "path";
import compression from "compression";
import sirv from "sirv";

const app = express();

app.use(compression());
app.use("/", sirv("./public", { extensions: [] }));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.resolve(__dirname, "../views"));
app.set('view engine', 'ejs');

export { app };

// some static pages
import("./setup/tradew1nd");
import("./setup/redirectors");
import("./setup/uop");
import("./setup/midi-sort");
// elevator last because wildcard
import("./setup/elevator");

const server = app.listen(process.env.PORT || 3000, async () => {
	const info = <any>server.address();
	const port = info.port;
	console.log('North Central listening at port %s', port);
});
