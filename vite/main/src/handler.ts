import * as THREE from "three";
import { scene, buttonD, buttonU, display, doorL, doorR, midX, midY, sign, pointLight, obj, loadFloor, music, light, donation, suggestion, smoothScroll } from ".";
import { toggleContent } from "./helpers/html";
import { CONTENTS, FLOORS } from "./constants";
import { displayTexture } from "./generators";
import { camera, currentFloor, DEBUG, floor, ratio, rotatedX, rotatedY, started, targetFloor, touched } from "./states";
import { getConfig, toggleMusic, toggleSmoothScroll, wait } from "./helpers/control";
import { clamp } from "./helpers/math";

enum State {
	INSIDE = 0,
	OPENING = 1,
	OUTSIDE = 2,
	CLOSING = 3,
	WAITING = 4,
};

// various variables
let state = State.INSIDE;
const offsets = { x: 0, y: 0 };
const touch = { originX: 0, originY: 0, ix: 0, iy: 0, x: 0, y: 0 };
let separation = 0;
let displayPressed = false, poppedState = false;
let diff = 0, scrollDisplacement = 0, scrollVelocity = 0;

window.addEventListener("touchstart", (e) => {
	var x, y;
	if (e.touches.length == 2) {
		separation = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
		x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
		y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
	} else {
		x = e.touches[0].clientX;
		y = e.touches[0].clientY;
	}
	touch.originX = touch.ix = touch.x = x;
	touch.originY = touch.iy = touch.y = y;
	touched(true);
});

window.addEventListener("touchmove", (e) => {
	var x, y, newSeparation = 0;
	if (e.touches.length == 2) {
		newSeparation = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
		x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
		y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
		if (newSeparation && div.classList.contains("hidden")) {
			scrollDisplacement += (newSeparation - separation) * 5;
			separation = newSeparation;
		}
	} else {
		x = e.touches[0].clientX;
		y = e.touches[0].clientY;
	}
	let canMove = false;
	if (ratio() > 1) canMove = Math.abs(x - touch.ix) > window.innerWidth / 16 || Math.abs(y - touch.iy) > window.innerHeight / 12;
	else if (ratio() < 1) canMove = Math.abs(y - touch.iy) > window.innerHeight / 16 || Math.abs(x - touch.ix) > window.innerWidth / 12;
	else canMove = Math.abs(x - touch.ix) > window.innerWidth / 12 || Math.abs(y - touch.iy) > window.innerHeight / 12;
	if (canMove && div.classList.contains("hidden")) {
		touch.ix = touch.x;
		touch.iy = touch.y;
		touch.x = x;
		touch.y = y;
		offsets.x += (touch.x - touch.ix) / midX * 2;
		offsets.y += (touch.y - touch.iy) / midY * 2;
		if (offsets.x > 2) offsets.x = 2;
		else if (offsets.x < -2) offsets.x = -2;
		if (offsets.y > 1) offsets.y = 1;
		else if (offsets.y < -1) offsets.y = -1;
	}
});

window.addEventListener("touchend", (e) => {
	if (!e.touches.length) touched(false);
	if (touch.x == touch.originX && touch.y == touch.originY) {
		clickEventsCommon({ clientX: touch.x, clientY: touch.y });
		if (!div.classList.contains("visuallyhidden") && e.touches.length == 0 && touch.originX == touch.x && touch.originY == touch.y) toggleContent();
	} else {
		if (e.touches.length) {
			touch.ix = touch.x = e.touches[0].clientX;
			touch.iy = touch.y = e.touches[0].clientY;
		}
	}
	if (buttonU.material.color.getHex() != 0xbbbbbb) { buttonU.material.color.setHex(0xbbbbbb); buttonU.position.z = -48.25 }
	if (buttonD.material.color.getHex() != 0xbbbbbb) { buttonD.material.color.setHex(0xbbbbbb); buttonD.position.z = -48.25 }
});

window.addEventListener("mousedown", e => {
	if (touched() || e.button !== 0) return;
	clickEventsCommon(e);
});

window.addEventListener("mousemove", (e) => {
	if (DEBUG || touched()) return;
	offsets.x = -((e.clientX - midX) / midX) * 2;
	offsets.y = -((e.clientY - midY) / midY);
	const mouse2D = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse2D, camera());
	const check: THREE.Object3D[] = [buttonU, buttonD, display, sign, music, light, donation, suggestion, smoothScroll];
	if (floor()?.listenMove) check.push(...floor()!.moveCheck());
	const intersect = raycaster.intersectObjects(check);
	if (intersect.length > 0) document.body.style.cursor = "pointer";
	else document.body.style.cursor = "default";
});

window.addEventListener("mouseup", () => {
	if (touched()) return touched(false);
	if (buttonU.material.color.getHex() != 0xbbbbbb) { buttonU.material.color.setHex(0xbbbbbb); buttonU.position.z = -48.25 }
	if (buttonD.material.color.getHex() != 0xbbbbbb) { buttonD.material.color.setHex(0xbbbbbb); buttonD.position.z = -48.25 }
});

function clickEventsCommon(e: { clientX: number, clientY: number }) {
	const mouse2D = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse2D, camera());
	let targetFl = targetFloor();
	const oldTargetFl = targetFl;
	const currentFl = currentFloor();
	let button, start = false;
	if (raycaster.intersectObject(buttonU).length > 0) {
		button = buttonU;
		if (currentFl != -1 && targetFl < FLOORS.size - 1)
			targetFl = targetFloor(targetFl + 1);
	} else if (raycaster.intersectObject(buttonD).length > 0) {
		button = buttonD;
		if (currentFl != -1 && targetFl > 0)
			targetFl = targetFloor(targetFl - 1);
	} else if (raycaster.intersectObject(display).length > 0 && currentFl != targetFl && currentFl != -1 && state != State.OPENING && state != State.CLOSING) displayPressed = true;
	else if (raycaster.intersectObject(sign).length > 0) {
		toggleContent({ page: floor()?.special ? floor()!.id : "ground", special: floor()?.special });
		start = true;
	} else if (raycaster.intersectObjects([music, light]).length > 0) {
		(light.material as THREE.MeshBasicMaterial).color.setHex(toggleMusic() ? 0x5acd9c : 0x103525);
	} else if (raycaster.intersectObject(donation).length > 0) {
		toggleContent({ html: () => CONTENTS.get(1000)!.get(), noFunc: true });
		start = true;
	} else if (raycaster.intersectObject(suggestion).length > 0) {
		toggleContent({ html: () => CONTENTS.get(1001)!.get(), noFunc: true });
		start = true;
	} else if (raycaster.intersectObject(smoothScroll).length > 0) {
		if (toggleSmoothScroll()) {
			smoothScroll.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
		} else {
			smoothScroll.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
		}
	} else if (floor()?.listenClick) {
		floor()!.clickRaycast(raycaster);
		start = true;
	} else start = true;
	if (button) {
		button.material.color.setHex(0xf7eb93);
		button.position.z = -48.5;
	}
	if (targetFl != oldTargetFl) {
		const xm = new THREE.MeshStandardMaterial({ map: displayTexture(targetFl), transparent: true });
		xm.map!.needsUpdate = true;
		display.material.splice(4, 1, xm);
	}
	if (!started() && start) {
		started(true);
		// initial start
		if (start && state != State.WAITING && !displayPressed) {
			state = State.OPENING;
			const audio = new Audio('/assets/sounds/lift.mp3');
			audio.play();
		}
	}
}

window.addEventListener("wheel", e => {
	if (div.classList.contains("hidden")) scrollDisplacement += e.deltaY;
});

window.addEventListener("keydown", e => {
	if (e.key == "Escape" && !div.classList.contains("hidden"))
		toggleContent();
});

function update() {
	// handle display pressed
	if (displayPressed) {
		if (state == State.OUTSIDE) state = State.CLOSING;
		displayPressed = false;
		diff = targetFloor() - currentFloor();
		var symbol;
		if (diff > 0) symbol = "▲";
		else symbol = "▼";
		const xm = new THREE.MeshStandardMaterial({ map: displayTexture(symbol), transparent: true });
		xm.map!.needsUpdate = true;
		display.material.splice(4, 1, xm);
		started(true);
	}
	// only do things when started
	if (started()) {
		// handle moving doors
		if (state == State.CLOSING) {
			if (doorR.position.x <= 12.5) {
				doorL.position.x = -12.5;
				doorR.position.x = 12.5;
				state = State.INSIDE;
			} else {
				doorL.translateX(0.4);
				doorR.translateX(-0.4);
			}
		} else if (state == State.OPENING) {
			if (doorR.position.x >= 37.5) {
				doorL.position.x = -37.5;
				doorR.position.x = 37.5;
				state = State.OUTSIDE;
			} else {
				doorL.translateX(-0.4);
				doorR.translateX(0.4);
			}
		}
		// call floor specific updates if they support it, only when they are visible
		if (state != State.INSIDE && floor()?.listenUpdate) floor()!.update(scene);
		// initiate movement to another floor
		if (state == State.INSIDE) {
			state = State.WAITING;
			setTimeout(() => {
				loadFloor();
				const targetFl = targetFloor();
				if (!poppedState) history.pushState({ floor: targetFl }, "", "/" + (targetFl == 0 ? "" : Array.from(FLOORS.keys())[targetFl]));
				else poppedState = false;
				currentFloor(targetFl);
				const xm = new THREE.MeshStandardMaterial({ map: displayTexture(currentFloor()), transparent: true });
				xm.map!.needsUpdate = true;
				display.material.splice(4, 1, xm);
	
				Object.values(obj).forEach(mesh => mesh.position.y += 1000 * diff);
				camera().position.setY(1000 * currentFloor());
				pointLight.position.add(new THREE.Vector3(0, 1000 * diff, 0));
				state = State.OPENING;
				const audio = new Audio('/assets/sounds/lift.mp3');
				audio.play();
			}, 500 + 200 * Math.abs(diff));
		}
		// scroll handling
		if (scrollDisplacement) {
			if (getConfig().smoothScroll) {
				var tmpDisplacement = scrollDisplacement;
				scrollVelocity += (scrollDisplacement < 0 ? -1 : 1) * (Math.abs(scrollVelocity) > Math.abs(scrollDisplacement) ? -1 : 1);
				tmpDisplacement -= scrollVelocity;
				if ((scrollDisplacement > 0 && tmpDisplacement < 0) || (scrollDisplacement < 0 && tmpDisplacement > 0)) scrollVelocity = scrollDisplacement;
				scrollDisplacement -= scrollVelocity;
			} else {
				handleWheel(scrollDisplacement);
				scrollDisplacement = 0;
			}
		} else if (scrollVelocity) {
			if (scrollVelocity < 0) {
				if (scrollVelocity > -1) scrollVelocity = 0;
				else scrollVelocity += 1;
			} else {
				if (scrollVelocity < 1) scrollVelocity = 0;
				else scrollVelocity -= 1;
			}
		}
		if (scrollVelocity) handleWheel(scrollVelocity);
	}
	if (!DEBUG) {
		// move the camera around
		const cam = camera();
		// 60deg left/right
		// offset.x normalized to 2
		const point = new THREE.Vector3(cam.position.x - offsets.x * 10 * clamp(1 / ratio(), Math.tan(Math.PI / 6), Math.tan(Math.PI / 3)) - rotatedX() * 10, cam.position.y + (offsets.y + rotatedY()) * 10, cam.position.z - 20);
		cam.lookAt(point);
	}
}

let ticking = false;
setInterval(() => {
	if (!ticking) {
		ticking = true;
		update();
		ticking = false;
	}
}, 10);

window.onpopstate = async () => {
	if (!div.classList.contains("hidden")) toggleContent();
	await wait(250);
	const cam = camera();
	if (cam.position.x != 0 || cam.position.z != 0) {
		scrollDisplacement = -10000;
		await wait(1500);
	}
	targetFloor(history.state?.floor ?? 0);
	displayPressed = true;
	poppedState = true;
};

const div = document.getElementById("info")!;
div.addEventListener("wheel", () => {
	scrollDisplacement = scrollVelocity = 0;
});

function handleWheel(scroll: number) {
	scroll = scroll / 10;
	if (!div.classList.contains('hidden')) return;
	if (floor()?.handleWheel(scroll)) {
		scrollDisplacement = 0;
		scrollVelocity = 0;
	}
}