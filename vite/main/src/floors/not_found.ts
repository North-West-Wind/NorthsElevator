import * as THREE from "three";
import Floor from "../types/floor";
import { GLTF_LOADED } from "../3d/loaders";
import { infoPageHandler } from "./ground";
import { randomBetween } from "../helpers/math";

const SVG_NS = "http://www.w3.org/2000/svg";

type FireEntry = {
	mesh: THREE.Mesh;
	direction: THREE.Vector3;
}

const FIRE_COLOR = [
	0xffc003,
	0xff5500,
	0xff5917
];

class FireParticle {
	svg: SVGGElement;
	node: SVGEllipseElement;
	x: number;
	rot: number;
	finished = false;

	constructor(svg: SVGGElement) {
		this.svg = svg;
		this.node = document.createElementNS(SVG_NS, "ellipse");
		this.node.setAttribute("cx", "970");
		this.node.setAttribute("cy", "670");
		const radius = "" + randomBetween(10, 20);
		this.node.setAttribute("rx", radius);
		this.node.setAttribute("ry", radius);
		this.node.setAttribute("fill", FIRE_COLOR[Math.floor(Math.random() * FIRE_COLOR.length)].toString(16)); // no need padstart
		this.node.classList.add("fire");
		this.x = Math.round(Math.random() * 100);
		this.rot = Math.floor(Math.random() * 360);
	}

	start() {
		this.svg.append(this.node);
		const angle = randomBetween(0.1, Math.PI - 0.1, false);
		setTimeout(() => {
			this.node.style.transform = `translate(${15 * Math.cos(angle)}vw, ${-15 * Math.sin(angle)}vh)`;
			this.node.style.opacity = "0";
			setTimeout(() => {
				this.node.remove();
				this.finished = true;
			}, 2000);
		}, 100);
	}
}

export default class NotFoundFloor extends Floor {
	allFires: FireEntry[] = [];
	campfirePos: THREE.Vector3;
	// 2D
	fires: FireParticle[] = [];
	spawnTimer?: NodeJS.Timer;

	constructor() {
		super("not-found", 404); // 404 is completely for aesthetics lol
		this.listenUpdate = true;
		this.special = true;
		this.campfirePos = new THREE.Vector3(0, -50 + 1000 * this.num + 15, -200);
	}

	async spawn(scene: THREE.Scene) {
		const geometryF = new THREE.BoxGeometry(400, 2, 1000);
		const materialF = new THREE.MeshStandardMaterial({ color: 0x5b2e00 });
		const floor = new THREE.Mesh(geometryF, materialF);
		floor.position.set(0, this.num * 1000 - 40.5, -50 - 80);
		scene.add(floor);

		const campfire = await GLTF_LOADED.campfire.get();
		campfire.position.set(this.campfirePos.x, this.campfirePos.y, this.campfirePos.z);
		campfire.scale.set(10, 10, 10);
		scene.add(campfire);
	
		const stick = await GLTF_LOADED.stick.get();
		stick.position.set(40, -50 + 1000 * this.num + 15, -150);
		stick.setRotationFromAxisAngle(new THREE.Vector3(1, 0, -1), -Math.PI / 6);
		stick.scale.set(1.5, 1.5, 1.5);
		scene.add(stick);
	
		const marshmallow = await GLTF_LOADED.marshmallow.get();
		marshmallow.position.set(11.25, -7.25 + 1000 * this.num + 15, -178);
		marshmallow.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 1), Math.PI / 4);
		marshmallow.scale.set(10, 10, 10);
		scene.add(marshmallow);
	
		const pointLight = new THREE.PointLight(0xffda82, 7500, 300, 2);
		pointLight.position.set(0, -40 + 1000 * this.num + 15, -200)
		pointLight.castShadow = true;
		scene.add(pointLight);
		return { floor, campfire, stick, marshmallow, pointLight };
	}

	handleWheel(scroll: number) {
		const cam = this.main3d().camera;
		if (cam.position.y != 1000 * this.num) cam.position.y = 1000 * this.num;
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

	private createFire(scene: THREE.Scene, amount: number) {
		const fires: FireEntry[] = [];
		const zAxis = new THREE.Vector3(0, 0, 1);
		const yAxis = new THREE.Vector3(0, 1, 0);
		for (let ii = 0; ii < amount; ii++) {
			const geometryR = new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.5, 1));
			const materialR = new THREE.MeshBasicMaterial({ color: FIRE_COLOR[Math.floor(Math.random() * FIRE_COLOR.length)], transparent: true });
			const fire = new THREE.Mesh(geometryR, materialR);
			fire.position.set(this.campfirePos.x, this.campfirePos.y, this.campfirePos.z);
			fires.push({ mesh: fire, direction: new THREE.Vector3(1, 0, 0).applyAxisAngle(zAxis, THREE.MathUtils.randFloat(0.1, Math.PI * 0.5)).applyAxisAngle(yAxis, THREE.MathUtils.randFloat(0, Math.PI * 2)) });
			scene.add(fire);
		}
		return fires;
	}

	update(scene: THREE.Scene) {
		const newFires: FireEntry[] = [];
		for (let i = 0; i < this.allFires.length; i++) {
			const r = this.allFires[i];
			const result = r.mesh.position.addScaledVector(r.direction, 0.1);
			r.mesh.position.set(result.x, result.y, result.z);
			const distSqr = r.mesh.position.distanceToSquared(this.campfirePos);
			if (distSqr > 625) scene.remove(r.mesh);
			else {
				(r.mesh.material as THREE.Material).opacity = 1 - (distSqr / 625);
				newFires.push(r);
			}
		}
		if (this.allFires.length < 10 || Math.random() < 0.1) 
			newFires.push(...this.createFire(scene, 1));
		this.allFires = newFires;
	}

	loadContent() {
		if (this.main3d()) infoPageHandler();
	}

	loadSvg(background: HTMLDivElement) {
		const svg = background.querySelector<SVGGElement>("svg g#fires")!;
		this.spawnTimer = setInterval(() => {
			this.fires = this.fires.filter(r => !r.finished);
			const drop = new FireParticle(svg);
			drop.start();
			this.fires.push(drop);
		}, 250);
	}
}