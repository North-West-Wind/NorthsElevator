import * as THREE from "three";
import { TEXTURE_LOADER } from "./loaders";
import { isMusic, isSmoothScroll } from "../helpers/control";
import { configTexture } from "../helpers/macro";

type LiftObjects = { [key: string]: THREE.Mesh };

let objects: LiftObjects = {};

function addToObjects(...liftObjects: LiftObjects[]) {
	liftObjects.forEach(obj => {
		Object.entries(obj).forEach(([key, mesh]) => objects[key] = mesh);
	});
}

export function makeLift(scene: THREE.Scene, passedInFloor: number) {
	addToObjects(
		makeDoors(scene),
		makeFloor(scene),
		makeWalls(scene),
		makeButtons(scene),
		makeLeftButtons(scene),
		makeRightButtons(scene),
		makeSign(scene)
	);
	if (passedInFloor > 0)
		Object.values(objects).forEach(mesh => mesh.position.y += 1000 * passedInFloor);
	return objects as LiftObjects & {
		buttonU: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>,
		buttonD: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>,
		display: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial[], THREE.Object3DEventMap>,
	};
}

function makeDoors(scene: THREE.Scene): LiftObjects {
	const geometryS = new THREE.BoxGeometry(5, 50, 5);
	const material = new THREE.MeshStandardMaterial({ color: 0x777777 });
	const rectL = new THREE.Mesh(geometryS, material);
	const rectR = new THREE.Mesh(geometryS, material);
	rectL.position.set(-25, -5, -50);
	rectR.position.set(25, -5, -50);
	scene.add(rectL, rectR);

	const geometryT = new THREE.BoxGeometry(55, 5, 5);
	const rectT = new THREE.Mesh(geometryT, material);
	const rectB = new THREE.Mesh(geometryT, material);
	rectT.position.set(0, 22.5, -50);
	rectB.position.set(0, -32.49, -50);
	scene.add(rectT, rectB);

	const geometry = new THREE.BoxGeometry(25, 50, 2);
	const materialD = new THREE.MeshStandardMaterial({ color: 0xcccccc });
	const doorL = new THREE.Mesh(geometry, materialD);
	const doorR = new THREE.Mesh(geometry, materialD);
	doorL.position.set(-12.5, -5, -50);
	doorR.position.set(12.5, -5, -50);
	scene.add(doorL, doorR);
	return { rectL, rectR, rectT, rectB, doorL, doorR };
}

function makeFloor(scene: THREE.Scene): LiftObjects {
	const geometry = new THREE.BoxGeometry(100, 2, 100);
	const material = new THREE.MeshStandardMaterial({ color: 0x98f5a8 });
	const floor = new THREE.Mesh(geometry, material);
	floor.position.set(0, -31, 0);
	scene.add(floor);
	return { floor };
}

function makeWalls(scene: THREE.Scene): LiftObjects {
	const geometryF = new THREE.BoxGeometry(22.5, 80, 3);
	const material = new THREE.MeshStandardMaterial({ color: 0xfef0bc });
	const wallFL = new THREE.Mesh(geometryF, material);
	const wallFR = new THREE.Mesh(geometryF, material);
	wallFL.position.set(-38.5, -5, -50);
	wallFR.position.set(38.5, -5, -50);
	scene.add(wallFL, wallFR);

	const geometryFT = new THREE.BoxGeometry(75, 10, 3);
	const wallFT = new THREE.Mesh(geometryFT, material);
	wallFT.position.set(0, 30, -50);
	scene.add(wallFT);

	const geometryS = new THREE.BoxGeometry(3, 80, 100);
	const wallL = new THREE.Mesh(geometryS, material);
	const wallR = new THREE.Mesh(geometryS, material);
	wallL.position.set(-50, -5, 0);
	wallR.position.set(50, -5, 0);
	scene.add(wallL, wallR);

	const geometryC = new THREE.BoxGeometry(100, 2, 100);
	const ceiling = new THREE.Mesh(geometryC, material);
	ceiling.position.set(0, 36, 0);
	scene.add(ceiling);
	return { wallFL, wallFR, wallFT, wallL, wallR, ceiling };
}

function makeButtons(scene: THREE.Scene): LiftObjects {
	const geometryB = new THREE.BoxGeometry(5, 10, 0.5);
	const materialB = new THREE.MeshStandardMaterial({ color: 0xb4eafe });
	const base = new THREE.Mesh(geometryB, materialB);
	base.position.set(33.5, -5, -48.25);
	scene.add(base);

	const A = new THREE.Vector2(-1.5, -1);
	const B = new THREE.Vector2(1.5, -1);
	const C = new THREE.Vector2(0, 1);

	const height = 1;
	const vertices = [A, B, C];
	var Shape = new THREE.Shape();
	(function f(ctx) {
		ctx.moveTo(vertices[0].x, vertices[0].y);
		for (var i = 1; i < vertices.length; i++) {
			ctx.lineTo(vertices[i].x, vertices[i].y);
		}
		ctx.lineTo(vertices[0].x, vertices[0].y);
	})(Shape);
	var settings: THREE.ExtrudeGeometryOptions = {};
	settings.depth = height;
	settings.bevelEnabled = false;
	const geometry = new THREE.ExtrudeGeometry(Shape, settings);
	const materialU = new THREE.MeshStandardMaterial({ color: 0xbbbbbb });
	const materialD = new THREE.MeshStandardMaterial({ color: 0xbbbbbb });
	const buttonU = new THREE.Mesh(geometry, materialU);
	const buttonD = new THREE.Mesh(geometry, materialD);
	buttonU.position.set(33.5, -2.5, -48.25);
	buttonD.position.set(33.5, -7.5, -48.25);
	buttonD.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
	scene.add(buttonU, buttonD);

	const geometryD = new THREE.BoxGeometry(5, 5, 0.5);
	const xm = new THREE.MeshStandardMaterial({ map: displayTexture(0), transparent: true });
	const material = new THREE.MeshStandardMaterial({ color: 0x555555 });
	const materials = [
			material,
			material,
			material,
			material,
			xm,
			material
	];
	const display = new THREE.Mesh(geometryD, materials);
	display.position.set(33.5, 5, -48.25);
	scene.add(display);
	return { base, buttonU, buttonD, display };
}

function makeSign(scene: THREE.Scene): LiftObjects {
	var x = document.createElement("canvas");
	var xc = x.getContext("2d")!;
	x.width = 360;
	x.height = 600;
	const posX = x.width / 6;
	const posY = x.height / 12;
	xc.fillStyle = "#eeeeee";
	xc.fillRect(0, 0, x.width, x.height);
	xc.fillStyle = "#cccccc";
	for (let i = 1; i < 11; i++) xc.fillRect(posX, posY * i + 10, Math.round(Math.random() * 180) + 60, 30);

	const geometry = new THREE.BoxGeometry(2, 25, 15);
	var xm = new THREE.MeshStandardMaterial({ map: new THREE.Texture(x), transparent: true });
	xm.map!.needsUpdate = true;
	const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
	const materials = [
			material,
			xm,
			material,
			material,
			material,
			material
	];
	const sign = new THREE.Mesh(geometry, materials);
	sign.position.set(49, 0, -30);
	scene.add(sign);
	return { sign };
}

function makeLeftButtons(scene: THREE.Scene): LiftObjects {
	const speakerGeometry = new THREE.BoxGeometry(15, 10, 8);
	const speakerMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e2ce });
	const speaker = new THREE.Mesh(speakerGeometry, speakerMaterial);
	speaker.position.set(-37.5, 20.5, -50);
	speaker.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.1);

	const ballGeometry = new THREE.SphereGeometry(4);
	const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xc6bfa9 });
	const ball = new THREE.Mesh(ballGeometry, ballMaterial);
	ball.position.set(-37.5, 20.5, -48);

	const musicGeometry = new THREE.BoxGeometry(17, 8, 4);
	const musicTexture = new THREE.MeshStandardMaterial({ map: TEXTURE_LOADER.load("/assets/textures/elevator/music.svg", configTexture) });
	const musicMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
	const musicMaterials = [
			musicMaterial,
			musicMaterial,
			musicMaterial,
			musicMaterial,
			musicTexture,
			musicMaterial
	];
	const music = new THREE.Mesh(musicGeometry, musicMaterials);
	music.position.set(-37.5, 10.5, -50);

	const lightGeometry = new THREE.SphereGeometry(3);
	const lightMaterial = new THREE.MeshBasicMaterial({ color: isMusic() ? 0x5acd9c : 0x103525 });
	const light = new THREE.Mesh(lightGeometry, lightMaterial);
	light.position.set(-34.5, 10.5, -50);

	const donationGeometry = new THREE.BoxGeometry(16, 12, 3);
	const donationTexture = new THREE.MeshStandardMaterial({ map: TEXTURE_LOADER.load("/assets/textures/elevator/donation.svg", configTexture) });
	const donationMaterial = new THREE.MeshStandardMaterial({ color: 0x1c3750 });
	const donationMaterials = [
			donationMaterial,
			donationMaterial,
			donationMaterial,
			donationMaterial,
			donationTexture,
			donationMaterial
	];
	const donation = new THREE.Mesh(donationGeometry, donationMaterials);
	donation.position.set(-37.5, -0.5, -49.5);

	const suggestionShape = new THREE.Shape();
	suggestionShape.moveTo(0, 0);
	suggestionShape.lineTo(0, 16);
	suggestionShape.lineTo(-4, 12);
	suggestionShape.lineTo(-4, 0);
	suggestionShape.lineTo(0, 0);
	const suggestionGeometry = new THREE.ExtrudeGeometry(suggestionShape, { depth: 10 });
	const suggestionMaterial = new THREE.MeshStandardMaterial({ color: 0xc9eff1 });
	const suggestion = new THREE.Mesh(suggestionGeometry, suggestionMaterial);
	suggestion.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5);
	suggestion.position.set(-5, -8, 0);
	suggestion.position.add(new THREE.Vector3(-34.5, -16, -50));

	scene.add(speaker, ball, music, light, donation, suggestion);
	return { speaker, ball, music, light, donation, suggestion };
}

function makeRightButtons(scene: THREE.Scene): LiftObjects {
	const smoothGeometry = new THREE.BoxGeometry(5, 10, 1);
	const onTexture = new THREE.MeshStandardMaterial({ map: TEXTURE_LOADER.load("/assets/textures/elevator/smooth-scroll-on.svg", configTexture) });
	const offTexture = new THREE.MeshStandardMaterial({ map: TEXTURE_LOADER.load("/assets/textures/elevator/smooth-scroll-off.svg", configTexture) });
	const smoothMaterial = new THREE.MeshStandardMaterial({ color: 0x02583b });
	const smoothMaterials = [
		smoothMaterial,
		smoothMaterial,
		smoothMaterial,
		smoothMaterial,
		onTexture,
		offTexture,
	];
	const smoothScroll = new THREE.Mesh(smoothGeometry, smoothMaterials);
	smoothScroll.position.set(33.5, -17, -48.25);
	if (!isSmoothScroll())
		smoothScroll.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
	scene.add(smoothScroll);

	return { smoothScroll };
}

export function displayTexture(floor: string | number | null) {
	var x = document.createElement("canvas");
	var xc = x.getContext("2d")!;
	x.width = x.height = 400;
	xc.fillStyle = "#555555";
	xc.fillRect(0, 0, x.width, x.height);
	xc.fillStyle = "black";
	xc.fillRect(20, 20, x.width - 40, x.height - 40);
	xc.fillStyle = "red";
	xc.font = "256px 'Courier New'";
	xc.textAlign = "center";
	xc.textBaseline = "middle";
	if (floor !== 0 && !floor) xc.fillText("?", x.width / 2, x.height / 2);
	else if (typeof floor == "string") xc.fillText(floor, x.width / 2, x.height / 2);
	else xc.fillText(floor <= 0 ? "G" : floor.toString(), x.width / 2, x.height / 2);
	const texture = new THREE.Texture(x);
	texture.generateMipmaps = false;
	texture.minFilter = THREE.LinearFilter;
	texture.needsUpdate = true;
	return texture;
}