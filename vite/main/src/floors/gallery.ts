import * as THREE from "three";
import Floor from "../types/floor";
import { getCamera } from "../states";
import { LOADER } from "../loaders";
import { readPageGenerator } from "../helpers/reader";
import { hideOrUnhideInfo, setInnerHTML } from "../helpers/html";

const PAINTINGS = 20;
const PAINTING_LENGTH = 50;
const LENGTH_PER_PAINTING = PAINTING_LENGTH + 30;
const FLOOR_LENGTH = Math.ceil((PAINTINGS - 1) * 0.5) * LENGTH_PER_PAINTING;

const div = document.getElementById("info")!;
export default class GalleryFloor extends Floor {
	private static templateGenerator: (() => Promise<string> | string);
	private static fileNames: string[];
	paintings: THREE.Mesh[] = [];

	constructor() {
		super("gallery", 6);
		this.listenClick = true;
		this.listenMove = true;
	}

	static {
		this.templateGenerator = readPageGenerator("/contents/gallery/template.html", [])[0];
		fetch(`/files/${encodeURIComponent("public/assets/pfps")}`).then(async res => {
			if (!res.ok) return;
			const files = <string[]>await res.json();
			this.fileNames = files.sort();
		});
	}

	generate(scene: THREE.Scene) {
		const objects: any = {};

		const geometryR = new THREE.BoxGeometry(50, 2, FLOOR_LENGTH - 40);
		const materialR = new THREE.MeshStandardMaterial({ color: 0xad0000 });
		const rug = new THREE.Mesh(geometryR, materialR);
		rug.position.set(0, this.num * 1000 - 32, -(FLOOR_LENGTH - 40) * 0.5 - 50);
		scene.add(rug);
		objects.rug = rug;

		const geometryF = new THREE.BoxGeometry(80, 2, FLOOR_LENGTH);
		const materialF = new THREE.MeshStandardMaterial({ color: 0xfef0bc });
		const floor = new THREE.Mesh(geometryF, materialF);
		floor.position.set(0, this.num * 1000 - 33, -FLOOR_LENGTH * 0.5 - 50);
		scene.add(floor);
		objects.floor = floor;

		for (let ii = 1; ii < Math.floor(FLOOR_LENGTH / LENGTH_PER_PAINTING); ii++) {
			const pointLight = new THREE.PointLight(0xffffff, 1.4, 140, 2);
			pointLight.position.set(0, this.num * 1000 + 25, -LENGTH_PER_PAINTING * (ii + 0.5) - 50);
			pointLight.castShadow = true;
			scene.add(pointLight);
			objects["light"+ii] = pointLight;
		}

		const geometryS = new THREE.BoxGeometry(3, 80, FLOOR_LENGTH);
		const wallL = new THREE.Mesh(geometryS, materialF);
		const wallR = new THREE.Mesh(geometryS, materialF);
		wallL.position.set(-40, this.num * 1000 - 5, -FLOOR_LENGTH * 0.5 - 50);
		wallR.position.set(40, this.num * 1000 - 5, -FLOOR_LENGTH * 0.5 - 50);
		scene.add(wallL, wallR);
		objects.wallL = wallL;
		objects.wallR = wallR;

		const geometryC = new THREE.BoxGeometry(80, 2, FLOOR_LENGTH);
		const ceiling = new THREE.Mesh(geometryC, materialF);
		ceiling.position.set(0, this.num * 1000 + 36, -FLOOR_LENGTH * 0.5 - 50);
		scene.add(ceiling);
		objects.ceiling = ceiling;

		const geometryB = new THREE.BoxGeometry(80, 80, 2);
		const back = new THREE.Mesh(geometryB, materialF);
		back.position.set(0, this.num * 1000 - 5, -FLOOR_LENGTH - 50);
		scene.add(back);
		objects.back = back;

		for (let ii = 0; ii < PAINTINGS - 1; ii++) {
			const geometry = new THREE.BoxGeometry(2, 50, 50);
			const texture = LOADER.load(`/assets/pfps/${GalleryFloor.fileNames[ii]}`, texture => {
				texture.generateMipmaps = false;
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.LinearMipMapLinearFilter;
			});
			const xm = new THREE.MeshBasicMaterial({ map: texture });
			const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
			const painting = new THREE.Mesh(geometry, [xm, xm, material, material, material, material]);
			if (ii % 2) {
				// Put to right
				painting.position.set(39, this.num * 1000 + 5, -LENGTH_PER_PAINTING * ((ii * 0.5)) - 50);
			} else {
				// Put to left
				painting.position.set(-39, this.num * 1000 + 5, -LENGTH_PER_PAINTING * ((ii * 0.5) + 0.5) - 50);
			}
			scene.add(painting);
			this.paintings.push(painting);
			objects["painting"+ii] = painting;
		}

		const geometryP = new THREE.BoxGeometry(50, 50, 2);
		const texture = LOADER.load(`/assets/pfps/${GalleryFloor.fileNames[PAINTINGS - 1]}`, texture => {
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.LinearMipMapLinearFilter;
		});
		const xm = new THREE.MeshBasicMaterial({ map: texture });
		const materialP = new THREE.MeshStandardMaterial({ color: 0xffffff });
		const painting = new THREE.Mesh(geometryP, [materialP, materialP, materialP, materialP, xm, xm]);
		painting.position.set(0, this.num * 1000 + 5, -FLOOR_LENGTH - 49);
		scene.add(painting);
		this.paintings.push(painting);
		objects.painting = painting;

		return objects;
	}

	handleWheel(scroll: number) {
		const camera = getCamera();
		const maxDist = FLOOR_LENGTH + 10;
		if (camera.position.z >= -maxDist) camera.translateZ(-scroll);
		if (camera.position.z < -maxDist) camera.position.setZ(-maxDist);
		if (camera.position.z > 0) camera.position.setZ(0);
		camera.position.setX(0);
		camera.position.setY(this.num * 1000);
	}

	private openOrCloseGalleryInfo(index: number) {
		hideOrUnhideInfo(async hidden => {
			if (hidden) setInnerHTML(div, "");
			else {
				const file = GalleryFloor.fileNames[index];
				if (!file) return;
				setInnerHTML(div, (await GalleryFloor.templateGenerator()).replace("{title}", file.split(" ").slice(1).join(" ").split(".").slice(0, -1).join(".")).replace("{src}", `assets/pfps/${file}`));
			}
		});
	}

	clickRaycast(raycaster: THREE.Raycaster) {
		for (let ii = 0; ii < this.paintings.length; ii++)
			if (raycaster.intersectObject(this.paintings[ii]).length > 0) {
				this.openOrCloseGalleryInfo(ii);
				break;
			}
	}

	moveCheck() {
		return this.paintings;
	}
}