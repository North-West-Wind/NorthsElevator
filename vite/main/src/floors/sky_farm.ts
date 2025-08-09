import * as THREE from "three";
import Floor from "../types/floor";
import { TEXTURE_LOADER } from "../3d/loaders";
import { configTexture } from "../helpers/macro";

const div = document.getElementById("info")!;
export default class SkyFarmFloor extends Floor {
	constructor() {
		super("sky-farm", 3);
	}

	spawn(scene: THREE.Scene) {
		const geometryS = new THREE.BoxGeometry(250, 2, 250);
		const material = new THREE.MeshBasicMaterial({ color: 0x46c7ec });
		const skyT = new THREE.Mesh(geometryS, material);
		const skyB = new THREE.Mesh(geometryS, material);
		skyT.position.set(0, 3125, -175);
		skyB.position.set(0, 2875, -175);
	
		const geometryW = new THREE.BoxGeometry(2, 250, 250);
		const skyL = new THREE.Mesh(geometryW, material);
		const skyR = new THREE.Mesh(geometryW, material);
		skyL.position.set(-126, 3000, -175);
		skyR.position.set(126, 3000, -175);
	
		const geometryF = new THREE.BoxGeometry(250, 250, 2);
		const skyF = new THREE.Mesh(geometryF, material);
		skyF.position.set(0, 3000, -301);
		scene.add(skyT, skyB, skyL, skyR, skyF);
	
		const geometryB = new THREE.BoxGeometry(24, 8, 24);
		const matSide = new THREE.MeshBasicMaterial({ color: 0x888888, map: TEXTURE_LOADER.load("/assets/textures/grass/side.png", tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.offset.set(0, 0); tex.repeat.set(3, 1); configTexture(tex); }) });
		const materials = [
				matSide,
				matSide,
				new THREE.MeshBasicMaterial({ color: 0x888888, map: TEXTURE_LOADER.load("/assets/textures/grass/top.png", tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.offset.set(0, 0); tex.repeat.set(3, 3); configTexture(tex); }) }),
				matSide,
				matSide,
				new THREE.MeshBasicMaterial({ color: 0x888888, map: TEXTURE_LOADER.load("/assets/textures/grass/bottom.png", tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.offset.set(0, 0); tex.repeat.set(3, 3); configTexture(tex); }) }),
		];
		const block = new THREE.Mesh(geometryB, materials);
		block.position.set(0, 2970, -175);
		scene.add(block);
	
		const geometryL = new THREE.BoxGeometry(8, 40, 8);
		const matSideL = new THREE.MeshBasicMaterial({ color: 0x888888, map: TEXTURE_LOADER.load("/assets/textures/tree/side.png", tex => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.offset.set(0, 0); tex.repeat.set(1, 5); configTexture(tex); }) });
		const materialsL = [
				matSideL,
				matSideL,
				new THREE.MeshBasicMaterial({ color: 0x888888, map: TEXTURE_LOADER.load("/assets/textures/tree/top.png", configTexture) }),
				matSideL,
				matSideL,
				new THREE.MeshBasicMaterial({ color: 0x888888, map: TEXTURE_LOADER.load("/assets/textures/tree/top.png", configTexture) })
		];
		const logs = new THREE.Mesh(geometryL, materialsL);
		logs.position.set(0, 2994, -175);
		scene.add(logs);

		const leavesTexture = TEXTURE_LOADER.load("/assets/textures/tree/leaves.png", configTexture);
		const geometryLeaves = new THREE.BoxGeometry(8, 8, 8);
		const materialLeaves = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, map: leavesTexture });

		const makeLeavesMesh = () => new THREE.Mesh(geometryLeaves, Array(6).fill(() => materialLeaves).map(x => x()));

		const leavesGroup = new THREE.Group();

		for (let ii = 0; ii < 5; ii++) {
			for (let jj = 0; jj < 5; jj++) {
				if (ii == 2 && jj == 2) continue;
				for (let kk = 0; kk < 2; kk++) {
					const leaves = makeLeavesMesh();
					leaves.rotateX(Math.floor(Math.random() * 4) * Math.PI / 2);
					leaves.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);
					leaves.rotateZ(Math.floor(Math.random() * 4) * Math.PI / 2);
					leaves.position.set((ii - 2) * 8, 2994 + (kk * 8), -175 + (jj - 2) * 8);
					leavesGroup.add(leaves);
				}
			}
		}

		for (let ii = 0; ii < 3; ii++) {
			for (let jj = 0; jj < 3; jj++) {
				if (ii == 1 && jj == 1) continue;
				const leaves = makeLeavesMesh();
				leaves.rotateX(Math.floor(Math.random() * 4) * Math.PI / 2);
				leaves.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);
				leaves.rotateZ(Math.floor(Math.random() * 4) * Math.PI / 2);
				leaves.position.set((ii - 1) * 8, 3010, -175 + (jj - 1) * 8);
				leavesGroup.add(leaves);
			}
		}

		for (let ii = 0; ii < 3; ii++) {
			const leaves = makeLeavesMesh();
			leaves.rotateX(Math.floor(Math.random() * 4) * Math.PI / 2);
			leaves.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);
			leaves.rotateZ(Math.floor(Math.random() * 4) * Math.PI / 2);
			leaves.position.set((ii - 1) * 8, 3018, -175);
			leavesGroup.add(leaves);
		}

		for (let ii = 0; ii < 3; ii++) {
			const leaves = makeLeavesMesh();
			leaves.rotateX(Math.floor(Math.random() * 4) * Math.PI / 2);
			leaves.rotateY(Math.floor(Math.random() * 4) * Math.PI / 2);
			leaves.rotateZ(Math.floor(Math.random() * 4) * Math.PI / 2);
			leaves.position.set(0, 3018, -175 + (ii - 1) * 8);
			leavesGroup.add(leaves);
		}

		scene.add(leavesGroup);

		return { skyT, skyB, skyL, skyR, skyF, block, logs, leavesGroup };
	}

	handleWheel(scroll: number) {
		const cam = this.main3d().camera;
		const rotateAngle = -1;
		const maxDist0 = 100;
		const maxDist1 = 162;
		const maxDist2 = 8;
		const maxDist3 = 17.5;
		var zoomLimitReached = false, maxed = false;
		if (cam.position.z <= -maxDist0) {
			if (cam.position.z > -maxDist1 || scroll < 0) {
				cam.translateZ(-scroll);
				if (cam.position.z < -maxDist1) {
					cam.position.z = -maxDist1;
					if (this.main3d().touched) zoomLimitReached = true;
					maxed = true;
				}
				cam.position.x = -(Math.abs(cam.position.z) - maxDist0) * maxDist2 / (maxDist1 - maxDist0);
				cam.position.y = -(Math.abs(cam.position.z) - maxDist0) * maxDist3 / (maxDist1 - maxDist0) + this.num * 1000;
				this.main3d().rotatedX = rotateAngle * (Math.abs(cam.position.z) - maxDist0) / (maxDist1 - maxDist0);
			} else if (scroll > 0 && !this.main3d().touched) {
				if (div.classList.contains('hidden')) this.main3d().toggleContent(this, () => this.main3d().contentById(this.id));
			}
		} else {
			cam.translateZ(-scroll);
			if (cam.position.z > 0) {
				cam.position.z = 0;
				maxed = true;
			}
			if (cam.position.x != 0) cam.position.x = 0;
			if (cam.position.y != this.num * 1000) cam.position.y = this.num * 1000;
			this.main3d().rotatedX = 0;
		}

		if (zoomLimitReached) this.main3d().toggleContent(this, () => this.main3d().contentById(this.id));
		return maxed;
	}
}