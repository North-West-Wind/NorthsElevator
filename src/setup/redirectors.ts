import { app } from "../index.js";

app.get("/matrix", (_req, res) => res.redirect(301, "https://matrix.to/#/#northwestwind:matrix.northwestw.in"));
app.get("/portal", (_req, res) => res.render("portal"));