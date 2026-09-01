import * as THREE from "three";
import { GLTF_LOADED, TEXTURE_LOADER } from "./loaders";
import { cacheApiConfig, isMusic, isSmoothScroll } from "../helpers/control";
import { configTexture } from "../helpers/macro";

type LiftObjects = { [key: string]: THREE.Mesh | THREE.Group };

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
		makeSign(scene),
		makeBoard(scene),
		makeFork(scene),
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

	const ballCanvas = new OffscreenCanvas(400, 400);
	const ballCtx = ballCanvas.getContext("2d")!;
	const segments = 50;
	ballCtx.fillStyle = "#c6bfa9";
	ballCtx.fillRect(0, 0, ballCanvas.width, ballCanvas.height);
	ballCtx.translate(ballCanvas.width / 2, ballCanvas.height / 2);
	ballCtx.rotate(Math.PI * 0.25);
	ballCtx.translate(-ballCanvas.width / 2, -ballCanvas.height / 2);
	ballCtx.fillStyle = "#9e9885";
	for (let ii = 0; ii < segments; ii++) {
		ballCtx.fillRect(ii * ballCanvas.width / segments, 0, ballCanvas.width / (segments * 2), ballCanvas.height);
		ballCtx.fillRect(0, ii * ballCanvas.height / segments, ballCanvas.width, ballCanvas.height / (segments * 2));
	}

	const ballTexture = new THREE.CanvasTexture(ballCanvas);
	ballTexture.generateMipmaps = false;
	ballTexture.minFilter = THREE.LinearFilter;

	const ballGeometry = new THREE.SphereGeometry(4);
	const ballMaterial = new THREE.MeshStandardMaterial({ map: ballTexture });
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

	const holeShape = new THREE.Shape();
	holeShape.moveTo(-3, 0);
	holeShape.lineTo(3, 0);
	holeShape.quadraticCurveTo(4, 0, 4, 1);
	holeShape.quadraticCurveTo(4, 2, 3, 2);
	holeShape.lineTo(-3, 2);
	holeShape.quadraticCurveTo(-4, 2, -4, 1);
	holeShape.quadraticCurveTo(-4, 0, -3, 0);
	const holeGeometry = new THREE.ShapeGeometry(holeShape);
	const holeMaterial = new THREE.MeshStandardMaterial({ color: 0xb5d2d4 });
	const hole = new THREE.Mesh(holeGeometry, holeMaterial);
	hole.position.add(new THREE.Vector3(-34.5, -16, -45.8));

	scene.add(speaker, ball, music, light, donation, suggestion, hole);
	return { speaker, ball, music, light, donation, suggestion, hole };
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

	const twoDimension = new THREE.Group();
	const layer1Geometry = new THREE.BoxGeometry(7, 7, 0.5);
	const layer1Material = new THREE.MeshStandardMaterial({ color: 0x95ffae });
	const layer1 = new THREE.Mesh(layer1Geometry, layer1Material);
	layer1.position.set(33.5, 17, -48.25);

	const layer2Geometry = new THREE.BoxGeometry(7, 7, 1);
	const layer2Material = new THREE.MeshStandardMaterial({ color: 0xeaff95 });
	const layer2 = new THREE.Mesh(layer2Geometry, layer2Material);
	layer2.setRotationFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.25);
	layer2.position.set(33.5, 17, -48.25);

	const squareGeometry = new THREE.BoxGeometry(3, 3, 1.01);
	const squareMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
	const square = new THREE.Mesh(squareGeometry, squareMaterial);
	square.position.set(33.5, 17, -48.25);

	const strokeGeometry = new THREE.EdgesGeometry(squareGeometry);
	const strokeMaterial = new THREE.LineBasicMaterial({ color: 0 });
	const stroke = new THREE.LineSegments(strokeGeometry, strokeMaterial);
	stroke.position.set(33.5, 17, -48.25);

	twoDimension.add(layer1, layer2, square, stroke);
	scene.add(smoothScroll, twoDimension);

	const stampGlassGeometry = new THREE.BoxGeometry(3, 1.5, 3);
	const stampGlassMaterial = new THREE.MeshStandardMaterial({ color: 0xc9eff1, opacity: 0.5, transparent: true });
	const stampGlass = new THREE.Mesh(stampGlassGeometry, stampGlassMaterial);

	const stampBaseGeometry = new THREE.BoxGeometry(2.5, 1.5, 2.5);
	const stampBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x865536 });
	const stampBase = new THREE.Mesh(stampBaseGeometry, stampBaseMaterial);

	const stampStickGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3);
	const stampStickMaterial = new THREE.MeshStandardMaterial({ color: 0xd29934 });
	const stampStick = new THREE.Mesh(stampStickGeometry, stampStickMaterial);

	stampGlass.position.set(39.5, -16, -47.25);
	stampBase.position.set(39.5, -15.5, -47.25);
	stampStick.position.set(39.5, -13.5, -47.25);

	const stamp = new THREE.Group();
	stamp.add(stampGlass, stampBase, stampStick);
	scene.add(stamp);

	return { smoothScroll, twoDimension, stamp };
}

function makeBoard(scene: THREE.Scene): LiftObjects {
	const obj: LiftObjects = {};

	const geometry = new THREE.BoxGeometry(10, 20, 1);
	const material = new THREE.MeshBasicMaterial({ color: 0x073c6b });
	const boardBase = new THREE.Mesh(geometry, material);
	boardBase.position.set(43, -1, -48.9);

	const buttonMeshes: THREE.Mesh[] = [];
	const buttonGeometry = new THREE.PlaneGeometry(9, 9 * 31 / 88);
	for (let ii = 0; ii < 4; ii++) {
		const button = new THREE.Mesh(buttonGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
		button.position.set(43, -1 + (ii - 1.5) * 9 * 1.45 * 31 / 88, -47.5);
		scene.add(button);
		obj["boardButton" + ii] = button;
		buttonMeshes.push(button);
	}

	cacheApiConfig().then(config => {
		if (config) {
			const buttons = (config.buttons as string[]).map(val => ({ val, sort: Math.random() + (val.endsWith(".gif") ? 1 : 0) })).sort((a, b) => a.sort - b.sort).map(({ val }) => val);
			for (const buttonMesh of buttonMeshes)
				if (buttons.length)
					buttonMesh.material = new THREE.MeshBasicMaterial({ map: TEXTURE_LOADER.load(`/assets/images/buttons/${buttons.shift()}`, configTexture) });
		}
	});

	scene.add(boardBase);
	obj["boardBase"] = boardBase;

	return obj;
}

function makeFork(scene: THREE.Scene): LiftObjects {
	const fork = GLTF_LOADED.fork.got()!;
	fork.scale.set(1.5, 1.5, 1.5);
	fork.rotateY(Math.random() * 2 * Math.PI);
	fork.position.set(Math.random() * 60 - 30, -29, -Math.random() * 30 - 10);
	scene.add(fork);
	
	return { fork };
}

export function displayTexture(floor: boolean | number | null) {
	const x = new OffscreenCanvas(400, 400);
	var xc = x.getContext("2d")!;
	xc.fillStyle = "#555555";
	xc.fillRect(0, 0, x.width, x.height);
	xc.fillStyle = "black";
	xc.fillRect(20, 20, x.width - 40, x.height - 40);
	xc.fillStyle = "red";
	xc.font = "256px 'YosterIsland'";
	xc.textAlign = "center";
	xc.textBaseline = "middle";
	if (typeof floor == "boolean") {
		// true = up, false = down
		xc.translate(200, 200);
		if (!floor) xc.rotate(Math.PI);
		xc.beginPath();
		xc.moveTo(0, -100);
		xc.lineTo(110.85, 92);
		xc.lineTo(-110.85, 92);
		xc.fill();
		xc.resetTransform();
	} else if (floor !== 0 && !floor) xc.fillText("?", x.width / 2, x.height / 2);
	else xc.fillText(floor <= 0 ? "G" : floor.toString(), x.width / 2, x.height / 2);
	const texture = new THREE.CanvasTexture(x);
	texture.generateMipmaps = false;
	texture.minFilter = THREE.LinearFilter;
	texture.needsUpdate = true;
	return texture;
}