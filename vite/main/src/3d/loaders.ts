import { Group, TextureLoader } from "three";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { LazyLoader } from "../types/misc";

const MODELS = [
	"armor_stand",
	"repeater",
	"desk",
	"piano",
	"campfire",
	"stick",
	"marshmallow",
	"fork"
];

export const TEXTURE_LOADER = new TextureLoader();
export const SVG_LOADER = new SVGLoader();
const GLTF_LOADER = new GLTFLoader();

export const GLTF_LOADED: { [key: string]: LazyLoader<Group> } = {};
function loadGltf(path: string) {
	GLTF_LOADED[path] = new LazyLoader(() => new Promise(res => GLTF_LOADER.load(`/assets/models/${path}/scene.gltf`, (gltf: GLTF) => { res(gltf.scene); })));
}
for (const model of MODELS) {
	loadGltf(model);
}