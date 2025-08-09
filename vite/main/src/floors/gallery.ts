import * as THREE from "three";
import Floor from "../types/floor";
import { TEXTURE_LOADER } from "../3d/loaders";
import { fetchText } from "../helpers/reader";
import { LazyLoader } from "../types/misc";

const TEMPLATE = new LazyLoader(() => fetchText("/contents/gallery/template.html"));
let FILES: string[] = [];

fetch(`/api/config`).then(async res => {
	if (!res.ok) return;
	const files = <string[]>(await res.json()).pfps;
	FILES = files.sort();
});

const PAINTING_LENGTH = 50;
const LENGTH_PER_PAINTING = PAINTING_LENGTH + 30;

export default class GalleryFloor extends Floor {
	private static fileNames: Promise<string[]>;
	private static floorLength: number;
	paintings: THREE.Mesh[] = [];

	constructor() {
		super("gallery", 6);
		this.listenClick = true;
		this.listenMove = true;
	}

	static {
		this.fileNames = fetch(`/api/config`).then(res => res.json()).then(json => json.pfps.sort());
		this.floorLength = 0;
		this.fileNames.then(pfps => this.floorLength = Math.ceil((pfps.length - 1) * 0.5) * LENGTH_PER_PAINTING);
	}

	async spawn(scene: THREE.Scene) {
		const fileNames = await GalleryFloor.fileNames;
		const paintings = fileNames.length;
		const floorLength = Math.ceil((paintings - 1) * 0.5) * LENGTH_PER_PAINTING;
		const objects: any = {};

		const geometryR = new THREE.BoxGeometry(50, 2, floorLength - 40);
		const materialR = new THREE.MeshStandardMaterial({ color: 0xad0000 });
		const rug = new THREE.Mesh(geometryR, materialR);
		rug.position.set(0, this.num * 1000 - 32, -(floorLength - 40) * 0.5 - 50);
		scene.add(rug);
		objects.rug = rug;

		const geometryF = new THREE.BoxGeometry(80, 2, floorLength);
		const materialF = new THREE.MeshStandardMaterial({ color: 0xfef0bc });
		const floor = new THREE.Mesh(geometryF, materialF);
		floor.position.set(0, this.num * 1000 - 33, -floorLength * 0.5 - 50);
		scene.add(floor);
		objects.floor = floor;

		for (let ii = 1; ii < Math.floor(floorLength / LENGTH_PER_PAINTING); ii++) {
			const pointLight = new THREE.PointLight(0xffffff, 92, 90, 0.9);
			pointLight.position.set(0, this.num * 1000, -LENGTH_PER_PAINTING * (ii + 0.5) - 30);
			scene.add(pointLight);
			objects["light"+ii] = pointLight;
		}

		const geometryS = new THREE.BoxGeometry(3, 80, floorLength);
		const wallL = new THREE.Mesh(geometryS, materialF);
		const wallR = new THREE.Mesh(geometryS, materialF);
		wallL.position.set(-40, this.num * 1000 - 5, -floorLength * 0.5 - 50);
		wallR.position.set(40, this.num * 1000 - 5, -floorLength * 0.5 - 50);
		scene.add(wallL, wallR);
		objects.wallL = wallL;
		objects.wallR = wallR;

		const geometryC = new THREE.BoxGeometry(80, 2, floorLength);
		const ceiling = new THREE.Mesh(geometryC, materialF);
		ceiling.position.set(0, this.num * 1000 + 36, -floorLength * 0.5 - 50);
		scene.add(ceiling);
		objects.ceiling = ceiling;

		const geometryB = new THREE.BoxGeometry(80, 80, 2);
		const back = new THREE.Mesh(geometryB, materialF);
		back.position.set(0, this.num * 1000 - 5, -floorLength - 50);
		scene.add(back);
		objects.back = back;

		for (let ii = 0; ii < paintings - 1; ii++) {
			const geometry = new THREE.BoxGeometry(2, 50, 50);
			const texture = TEXTURE_LOADER.load(`/assets/pfps/smaller/${fileNames[ii]}`, texture => {
				texture.generateMipmaps = false;
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.LinearMipMapLinearFilter;
				texture.colorSpace = THREE.SRGBColorSpace;
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
		const texture = TEXTURE_LOADER.load(`/assets/pfps/smaller/${fileNames[paintings - 1]}`, texture => {
			texture.generateMipmaps = false;
			texture.magFilter = THREE.NearestFilter;
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			texture.colorSpace = THREE.SRGBColorSpace;
		});
		const xm = new THREE.MeshBasicMaterial({ map: texture });
		const materialP = new THREE.MeshStandardMaterial({ color: 0xffffff });
		const painting = new THREE.Mesh(geometryP, [materialP, materialP, materialP, materialP, xm, xm]);
		painting.position.set(0, this.num * 1000 + 5, -floorLength - 49);
		scene.add(painting);
		this.paintings.push(painting);
		objects.painting = painting;

		return objects;
	}

	handleWheel(scroll: number) {
		let maxed = false;
		const cam = this.main3d().camera;
		const maxDist = GalleryFloor.floorLength + 10;
		if (cam.position.z >= -maxDist) cam.translateZ(-scroll);
		if (cam.position.z < -maxDist) {
			cam.position.setZ(-maxDist);
			maxed = true;
		}
		if (cam.position.z > 0) {
			cam.position.setZ(0);
			maxed = true;
		}
		cam.position.setX(0);
		cam.position.setY(this.num * 1000);
		return maxed;
	}

	private openOrCloseGalleryInfo(index: number) {
		this.main3d().toggleContent(this, async () => {
			const file = (await GalleryFloor.fileNames)[index];
			if (!file) return "";
			return (await TEMPLATE.get()).replace("{title}", file.split(" ").slice(1).join(" ").split(".").slice(0, -1).join(".")).replace("{src}", `assets/pfps/${file}`);
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

	async loadPicture(info: HTMLDivElement, index: number) {
		const file = FILES[index];
		info.innerHTML = (await TEMPLATE.get()).replace("{title}", file.split(" ").slice(1).join(" ").split(".").slice(0, -1).join(".")).replace("{src}", `/assets/pfps/${file}`);

		const h1 = info.querySelector<HTMLHeadingElement>("h1")!;
		h1.classList.add("sheet-back");
		h1.innerHTML = "<- " + h1.innerText;
		h1.onclick = () => this.loadContent(info);
	}

	async loadContent(info: HTMLDivElement) {
		if (this.main3d()) return;
		info.innerHTML = await this.content.get();

		let columnDiv: HTMLDivElement;
		for (let ii = 0; ii < FILES.length; ii++) {
			const file = FILES[ii];
			if (ii % 2 == 0) {
				columnDiv = document.createElement("div");
				columnDiv.classList.add("flex", "vcenter");
				info.appendChild(columnDiv);
			}
			const innerDiv = document.createElement("div");
			const h2 = document.createElement("h2");
			h2.innerHTML = file.split(" ").slice(1).join(" ").split(".").slice(0, -1).join(".");
			const img = document.createElement("img");
			img.src = `/assets/pfps/${file}`;
			innerDiv.appendChild(h2);
			innerDiv.appendChild(img);
			columnDiv!.appendChild(innerDiv);

			innerDiv.classList.add("link-like", "gallery-entry");
			innerDiv.onclick = () => this.loadPicture(info, ii);
		}
	}
}