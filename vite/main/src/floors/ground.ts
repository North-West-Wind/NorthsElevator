import * as THREE from "three";
import Floor from "../types/floor";
import { getConfig, writeConfig } from "../helpers/control";

class RainDrop {
	node: HTMLDivElement;
	x: number;
	rot: number;
	finished = false;

	constructor() {
		this.node = document.createElement("div");
		this.node.classList.add("rain");
		this.x = Math.round(Math.random() * 100);
		this.rot = Math.floor(Math.random() * 360);
	}

	start() {
		document.body.append(this.node);
		this.node.style.transform = `translateX(${this.x}vw) rotate(${this.rot}deg)`;
		setTimeout(() => {
			this.node.style.transform = `translate(${this.x}vw, calc(100vh + 3vmin)) rotate(${this.rot}deg)`;
			setTimeout(() => {
				this.node.remove();
				this.finished = true;
			}, 250);
		}, 250);
	}
}

export default class GroundFloor extends Floor {
	// 3D
	allRains: THREE.Mesh[] = [];
	// 2D
	rainDrops: RainDrop[] = [];
	spawnTimer?: NodeJS.Timer;

	constructor() {
		super("ground", 0);
		this.listenUpdate = true;
	}

	spawn(scene: THREE.Scene) {
		const geometry = new THREE.BoxGeometry(55, 2, 500);
		const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
		const floor = new THREE.Mesh(geometry, material);
		floor.position.set(0, -31, -300);
		scene.add(floor);
		return { floor };
	}

	handleWheel(scroll: number) {
		const cam = this.main3d().camera;
		if (cam.position.y != 0) cam.position.y = 0;
		const absoluted = Math.abs(scroll);
		if (cam.position.x != 0) {
			cam.translateX(cam.position.x > 0 ? -absoluted : absoluted);
			if (Math.abs(cam.position.x) <= absoluted) cam.position.x = 0;
		}
		if (cam.position.z != 0) {
			cam.translateZ(cam.position.z > 0 ? -absoluted : absoluted);
			if (Math.abs(cam.position.z) <= absoluted) cam.position.z = 0;
		}
		return true;
	}

	private createRain(scene: THREE.Scene, amount: number) {
		const rains = [];
		const geometryR = new THREE.SphereGeometry(0.25);
		const materialR = new THREE.MeshStandardMaterial({ color: 0x42a6e9 });
		for (let i = 0; i < amount; i++) {
			const rain = new THREE.Mesh(geometryR, materialR);
			rain.position.set(THREE.MathUtils.randFloatSpread(100), 100, -THREE.MathUtils.randFloatSpread(500) - 305);
			rains.push(rain);
			scene.add(rain);
		}
		return rains;
	}

	update(scene: THREE.Scene) {
		const newRains = [];
		for (let i = 0; i < this.allRains.length; i++) {
			const r = this.allRains[i];
			r.translateY(-Math.random() - 3);
			if (r.position.y <= -50) scene.remove(r);
			else newRains.push(r);
		}
		newRains.push(...this.createRain(scene, 10));
		this.allRains = newRains;
	}

	loadContent(info: HTMLDivElement) {
		infoPageHandler();
		if (this.main2d()) {
			// on-the-fly content patching
			info.querySelector<HTMLHeadingElement>("h1")!.innerHTML = "North's Elevator (2D Edition)";
			info.removeChild(info.querySelectorAll("p")[1]);
		}
	}

	loadSvg() {
		this.spawnTimer = setInterval(() => {
			this.rainDrops = this.rainDrops.filter(r => !r.finished);
			const drop = new RainDrop();
			drop.start();
			this.rainDrops.push(drop);
		}, 100);
	}

	unloadSvg() {
		if (this.spawnTimer) clearInterval(this.spawnTimer);
	}
}

export function infoPageHandler() {
	// Add buttons functionality
	if (getConfig().answerStorage) {
		const storageInfo = document.getElementById("storage-prompt")!;
		storageInfo.classList.add("hidden");
	}
	function accept() {
		getConfig().allowStorage = true;
		answer();
	}
	function answer() {
		getConfig().answerStorage = true;
		writeConfig();
		const storageInfo = document.getElementById("storage-prompt")!;
		storageInfo.classList.add("hidden");
	}

	(<HTMLAnchorElement>document.getElementsByClassName("storage-button accept")[0]).onclick = () => accept();
	(<HTMLAnchorElement>document.getElementsByClassName("storage-button deny")[0]).onclick = () => answer();
}