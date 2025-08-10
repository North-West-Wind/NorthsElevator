import * as THREE from "three";
import Floor from "../types/floor";
import { GLTF_LOADED, TEXTURE_LOADER } from "../3d/loaders";
import { LazyLoader } from "../types/misc";
import { fetchText } from "../helpers/reader";
import { configTexture } from "../helpers/macro";

enum ModPage {
	AUTO_FISH = "auto-fish",
	MORE_BOOTS = "more-boots",
	SHORT_CIRCUIT = "short-circuit"
};

const WATER_TEXTURES: THREE.Texture[] = [];
const MOD_CONTENTS = new Map<string, LazyLoader<string>>();
for (const page of Object.values(ModPage)) MOD_CONTENTS.set(page, new LazyLoader(() => fetchText(`/contents/mods/${page}.html`)));

export default class ModsFloor extends Floor {
	textureUpdater?: NodeJS.Timer;

	constructor() {
		super("mods", 2);
		this.disableContent = true;
		this.listenClick = true;
		this.listenMove = true;
	}

	async spawn(scene: THREE.Scene) {
		for (let i = 0; i < 32; i++) {
			const water = TEXTURE_LOADER.load(`/assets/textures/water/water_still-00-${(i < 10 ? "0" : "") + i}.png`, texture => {
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
				texture.offset.set(0, 0);
				texture.repeat.set(100, 100);
				configTexture(texture);
			});
			WATER_TEXTURES.push(water);
		}

		const geometryW = new THREE.BoxGeometry(1000, 10, 1000);
		const materialW = new THREE.MeshStandardMaterial({ map: WATER_TEXTURES[0], opacity: 1, transparent: true });
		materialW.map!.needsUpdate = true;
		const ocean = new THREE.Mesh(geometryW, materialW);
		ocean.position.set(0, this.num * 1000 - 53.5, -550);
		scene.add(ocean);

		const geometryF = new THREE.BoxGeometry(128, 16, 80);
		const oakF = TEXTURE_LOADER.load("/assets/textures/oak_planks.png", texture => {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(8, 5);
			configTexture(texture);
		});
		const materialF = new THREE.MeshStandardMaterial({ map: oakF });
		const oakFloor = new THREE.Mesh(geometryF, materialF);
		oakFloor.position.set(0, this.num * 1000 - 40.5, -90);
		scene.add(oakFloor);

		const spotLight = new THREE.SpotLight(0xfff8be, 4, 75, Math.PI / 2 - 0.001, 0, 0.01);
		spotLight.position.set(0, this.num * 1000 - 42, -120);
		spotLight.target.position.set(0, this.num * 1000 - 50, -120);
		scene.add(spotLight);

		const geometryR = new THREE.BoxGeometry(3, 80, 3);
		const materialR = new THREE.MeshStandardMaterial({ color: 0xad7726 });
		const fishingRod = new THREE.Mesh(geometryR, materialR);
		fishingRod.position.set(56, this.num * 1000 - 8.5, -122);
		fishingRod.setRotationFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 6);
		scene.add(fishingRod);

		const geometryS = new THREE.BoxGeometry(1, 80, 1);
		const materialS = new THREE.MeshStandardMaterial({ color: 0xffffff });
		const string = new THREE.Mesh(geometryS, materialS);
		string.position.set(56, this.num * 1000 - 16, -140);
		scene.add(string);

		const geometryH = new THREE.BoxGeometry(8, 16, 8);
		const materialH = new THREE.MeshStandardMaterial({ color: 0x7d4700 });
		const holder = new THREE.Mesh(geometryH, materialH);
		holder.position.set(56, this.num * 1000 - 24.5, -118);
		scene.add(holder);

		var oceanCounter = 0;
		this.textureUpdater = setInterval(() => {
			if (!ocean) return;
			oceanCounter = ++oceanCounter % 32;
			const materialW = new THREE.MeshStandardMaterial({ map: WATER_TEXTURES[oceanCounter], opacity: 1, transparent: true });
			materialW.map!.needsUpdate = true;
			ocean.material = materialW;
		}, 250);

		const armorStand = await GLTF_LOADED.armor_stand.get();
		armorStand.position.set(-48, this.num * 1000 - 30.5, -114);
		armorStand.rotation.set(0, Math.PI / 4, 0);
		armorStand.scale.set(20, 20, 20);
		scene.add(armorStand);

		const repeater = await GLTF_LOADED.repeater.get();
		const recursiveRough = (group: THREE.Group) => {
			group.children.forEach(child => {
				if (child.children.length) recursiveRough(child as THREE.Group);
				else if (child instanceof THREE.Mesh) {
					child.material.metalness = 0;
					child.material.roughness = 10;
				}
			});
		};
		recursiveRough(repeater);
		repeater.position.set(-26, this.num * 1000 - 28.8, -120);
		repeater.scale.set(10, 10, 10);
		repeater.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5);
		scene.add(repeater);
	
		/*const geometryC = new THREE.BoxGeometry(16, 16, 80);
		const material = new THREE.MeshBasicMaterial({ color: 0xa0a6a7 });
		const corridor = new THREE.Mesh(geometryC, material);
		corridor.position.set(0, this.num * 1000 - 38.5, -92.5);
		scene.add(corridor);
	
		const geometryP = new THREE.BoxGeometry(48, 16, 48);
		const platform = new THREE.Mesh(geometryP, material);
		platform.position.set(0, this.num * 1000 - 38.5, -156.5);
		scene.add(platform);*/
	
		const geometryB = new THREE.BoxGeometry(5, 7.5, 5);
		const materials = [
				new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load("/assets/textures/diamond_boots/side_0.png", configTexture) }),
				new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load("/assets/textures/diamond_boots/side_1.png", configTexture) }),
				new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load("/assets/textures/diamond_boots/bottom.png", configTexture) }),
				new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load("/assets/textures/diamond_boots/side_2.png", configTexture) }),
				new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load("/assets/textures/diamond_boots/side_3.png", configTexture) }),
				new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load("/assets/textures/diamond_boots/bottom.png", configTexture) }),
		];
		const bootL = new THREE.Mesh(geometryB, materials);
		const bootR = new THREE.Mesh(geometryB, materials);
		bootL.position.set(-48, this.num * 1000 - 26, -114);
		bootL.rotation.set(0, Math.PI / 4, 0);
		bootL.translateX(-2.5);
		bootR.position.set(-48, this.num * 1000 - 26, -114);
		bootR.rotation.set(0, Math.PI / 4, 0);
		bootR.translateX(2.5);
		scene.add(bootL, bootR);
	
		return { ocean, oakFloor, pointLight: spotLight, fishingRod, string, holder, armorStand, repeater, bootL, bootR };
	}

	despawn(scene: THREE.Scene) {
		super.despawn(scene);
		if (this.textureUpdater) clearInterval(this.textureUpdater);
	}

	handleWheel(scroll: number) {
		const cam = this.main3d().camera;
		if (cam.position.y != this.num * 1000) cam.position.y = this.num * 1000;
		const maxDist = 70;
		var maxed = false;
		if (!(cam.position.z == 0 && scroll < 0)) {
			cam.translateZ(-scroll);
			if (cam.position.z > 0) {
				cam.position.z = 0;
				maxed = true;
			}
			else if (cam.position.z < -maxDist) {
				cam.position.z = -maxDist;
				maxed = true;
			}
		}
		if (cam.position.x != 0) cam.position.x = 0;

		return maxed;
	}

	private async toggleModInfo(page: ModPage) {
		this.elevator().toggleContent(this, await MOD_CONTENTS.get(page)!.get());
	}

	clickRaycast(raycaster: THREE.Raycaster) {
		if (this.meshes) {
			if (raycaster.intersectObjects([<THREE.Mesh>this.meshes.fishingRod, <THREE.Mesh>this.meshes.string, <THREE.Mesh>this.meshes.holder]).length) this.toggleModInfo(ModPage.AUTO_FISH);
			else if (raycaster.intersectObjects([<THREE.Group>this.meshes.armorStand, <THREE.Mesh>this.meshes.bootL, <THREE.Mesh>this.meshes.bootR]).length) this.toggleModInfo(ModPage.MORE_BOOTS);
			else if (raycaster.intersectObject(this.meshes.repeater).length) this.toggleModInfo(ModPage.SHORT_CIRCUIT);
		}
	}

	moveCheck() {
		if (this.meshes) return [this.meshes.fishingRod, this.meshes.string, this.meshes.holder, this.meshes.armorStand, this.meshes.bootL, this.meshes.bootR, this.meshes.repeater];
		else return super.moveCheck();
	}

	loadSvg() {
		const rod = document.querySelector<SVGGElement>("#rod")!;
		const boots = document.querySelector<SVGGElement>("#boots")!;

		rod.classList.add("link-like");
		boots.classList.add("link-like");

		rod.onclick = () => this.toggleModInfo(ModPage.AUTO_FISH);
		boots.onclick = () => this.toggleModInfo(ModPage.MORE_BOOTS);
	}
}