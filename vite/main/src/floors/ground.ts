import * as THREE from "three";
import Floor from "../types/floor";
import { camera } from "../states";
import { getConfig, toggleSmoothScroll, writeConfig } from "../helpers/control";

export default class GroundFloor extends Floor {
	allRains: THREE.Mesh[] = [];

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
		const cam = camera();
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

	loadContent() {
		infoPageHandler();
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

	const setButtonText = (button: HTMLDivElement, prefix: string, key: string) => {
		if ((getConfig() as any)[key]) {
			button.innerHTML = prefix + ": On";
			button.classList.add("on");
			button.classList.remove("off");
		} else {
			button.innerHTML = prefix + ": Off";
			button.classList.add("off");
			button.classList.remove("on");
		}
	};

	const smoothScrollButton = document.getElementById("smooth-scroll") as HTMLDivElement;
	smoothScrollButton.onclick = () => {
		toggleSmoothScroll();
		setButtonText(smoothScrollButton, "Smooth Scroll", "smoothScroll");
	}
	setButtonText(smoothScrollButton, "Smooth Scroll", "smoothScroll");
}