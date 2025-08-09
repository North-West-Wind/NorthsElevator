import WebGL from "three/addons/capabilities/WebGL.js";
import init3D from "./3d/main3d";
import init2D from "./2d/main2d";
import { getConfig, writeConfig } from "./helpers/control";

let flat = getConfig().flat || new URLSearchParams(window.location.search).has("flat");
if (!flat && !WebGL.isWebGL2Available()) {
	alert("WebGL is not supported! You have lost your privilege to the R³ space.");
	flat = true;
}

if (flat) {
	getConfig().flat = true;
	writeConfig();
	init2D();
} else {
	init3D();
}