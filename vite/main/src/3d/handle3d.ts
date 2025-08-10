import * as THREE from "three";
import { Main3D } from "./main3d";
import { displayTexture } from "./generators";
import { getConfig, toggleMusic, toggleSmoothScroll, wait } from "../helpers/control";
import { clamp } from "../helpers/math";
import Elevator from "../main";
import Floor from "../types/floor";

enum State {
	INSIDE = 0,
	OPENING = 1,
	OUTSIDE = 2,
	CLOSING = 3,
	WAITING = 4,
};

export function setupHandlers(main3d: Main3D) {
	const { buttonU, buttonD, doorL, doorR, display, sign, music, light, donation, suggestion, smoothScroll, twoDimension } = main3d.objects;

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
		main3d.touched = true;
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
		const newOffsets = {
			x: offsets.x + (x - touch.ix) / main3d.midX * 2,
			y: offsets.y + (y - touch.iy) / main3d.midY * 2,
		};
		let noMove = false;
		if (main3d.ratio > 1) noMove = Math.abs(newOffsets.x) > window.innerWidth / 16 || Math.abs(newOffsets.y) > window.innerHeight / 12;
		else if (main3d.ratio < 1) noMove = Math.abs(newOffsets.y) > window.innerHeight / 16 || Math.abs(newOffsets.x) > window.innerWidth / 12;
		else noMove = Math.abs(newOffsets.x) > window.innerWidth / 12 || Math.abs(newOffsets.y) > window.innerHeight / 12;
		if (!noMove && div.classList.contains("hidden")) {
			touch.ix = touch.x;
			touch.iy = touch.y;
			touch.x = x;
			touch.y = y;
			offsets.x = newOffsets.x;
			offsets.y = newOffsets.y;
			if (offsets.x > 2) offsets.x = 2;
			else if (offsets.x < -2) offsets.x = -2;
			if (offsets.y > 1) offsets.y = 1;
			else if (offsets.y < -1) offsets.y = -1;
		}
	});

	window.addEventListener("touchend", (e) => {
		if (!e.touches.length) main3d.touchEnd = true;
		if (touch.x == touch.originX && touch.y == touch.originY) {
			clickEventsCommon({ clientX: touch.x, clientY: touch.y });
			if (!div.classList.contains("visuallyhidden") && e.touches.length == 0 && touch.originX == touch.x && touch.originY == touch.y) main3d.toggleContent(main3d.floor);
		} else {
			if (e.touches.length) {
				touch.ix = touch.x = e.touches[0].clientX;
				touch.iy = touch.y = e.touches[0].clientY;
			}
		}
		if (buttonU.material.color.getHex() != 0xbbbbbb) {
			buttonU.material.color.setHex(0xbbbbbb);
			buttonU.position.z = -48.25;
		}
		if (buttonD.material.color.getHex() != 0xbbbbbb) {
			buttonD.material.color.setHex(0xbbbbbb);
			buttonD.position.z = -48.25;
		}
	});

	window.addEventListener("mousedown", e => {
		if (main3d.touched || e.button !== 0) return;
		clickEventsCommon(e);
	});

	window.addEventListener("mousemove", (e) => {
		// For some reason, mousemove is fired at touchend
		if (main3d.touchEnd) {
			main3d.touched = false;
			return;
		}
		if (Elevator.DEBUG || main3d.touched) return;
		offsets.x = -((e.clientX - main3d.midX) / main3d.midX) * 2;
		offsets.y = -((e.clientY - main3d.midY) / main3d.midY);
		const mouse2D = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse2D, main3d.camera);
		const check: THREE.Object3D[] = [buttonU, buttonD, display, sign, music, light, donation, suggestion, smoothScroll, twoDimension];
		if (main3d.floor?.listenMove) check.push(...main3d.floor.moveCheck());
		const intersect = raycaster.intersectObjects(check);
		if (intersect.length > 0) document.body.style.cursor = "pointer";
		else document.body.style.cursor = "default";
	});

	window.addEventListener("mouseup", () => {
		if (main3d.touched) return main3d.touched = false;
		if (buttonU.material.color.getHex() != 0xbbbbbb) { buttonU.material.color.setHex(0xbbbbbb); buttonU.position.z = -48.25 }
		if (buttonD.material.color.getHex() != 0xbbbbbb) { buttonD.material.color.setHex(0xbbbbbb); buttonD.position.z = -48.25 }
	});

	function clickEventsCommon(e: { clientX: number, clientY: number }) {
		const mouse2D = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse2D, main3d.camera);
		const oldTargetFl = main3d.targetFloor;
		let button, start = false;
		if (raycaster.intersectObject(buttonU).length > 0) {
			button = buttonU;
			if (main3d.currentFloor != -1 && main3d.targetFloor < main3d.floors.size - 1)
				main3d.targetFloor++;
		} else if (raycaster.intersectObject(buttonD).length > 0) {
			button = buttonD;
			if (main3d.currentFloor != -1 && main3d.targetFloor > 0)
				main3d.targetFloor--;
		} else if (raycaster.intersectObject(display).length > 0 && main3d.currentFloor != main3d.targetFloor && main3d.currentFloor != -1 && state != State.OPENING && state != State.CLOSING) displayPressed = true;
		else if (raycaster.intersectObject(sign).length > 0) {
			let floorOverride: Floor;
			if (main3d.floor.special) floorOverride = main3d.statusFloors.get(main3d.floor.id)!;
			else floorOverride = main3d.floors.get("ground")!;
			main3d.toggleContent(floorOverride, () => floorOverride.content.get());
			start = true;
		} else if (raycaster.intersectObjects([music, light]).length > 0) {
			((<THREE.Mesh<any, THREE.MeshStandardMaterial>>light).material).color.setHex(toggleMusic() ? 0x5acd9c : 0x103525);
		} else if (raycaster.intersectObject(donation).length > 0) {
			main3d.toggleContent(undefined, () => main3d.contentByNum(1000));
			start = true;
		} else if (raycaster.intersectObject(suggestion).length > 0) {
			main3d.toggleContent(undefined, () => main3d.contentByNum(1001));
			start = true;
		} else if (raycaster.intersectObject(smoothScroll).length > 0) {
			if (toggleSmoothScroll()) {
				smoothScroll.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
			} else {
				smoothScroll.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
			}
		} else if (raycaster.intersectObject(twoDimension).length > 0) {
			window.location.href = window.location.pathname + (window.location.search ? window.location.search + "&flat" : "?flat");
		} else if (main3d.floor?.listenClick) {
			main3d.floor.clickRaycast(raycaster);
			start = true;
		} else start = true;
		if (button) {
			button.material.color.setHex(0xf7eb93);
			button.position.z = -48.5;
		}
		if (main3d.targetFloor != oldTargetFl) {
			const xm = new THREE.MeshStandardMaterial({ map: displayTexture(main3d.targetFloor), transparent: true });
			xm.map!.needsUpdate = true;
			display.material.splice(4, 1, xm);
		}
		if (!main3d.started && start) {
			main3d.started = true;
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
			main3d.toggleContent(main3d.floor);
	});

	function update() {
		// handle display pressed
		if (displayPressed) {
			if (state == State.OUTSIDE) state = State.CLOSING;
			displayPressed = false;
			diff = main3d.targetFloor - main3d.currentFloor;
			var symbol;
			if (diff > 0) symbol = "▲";
			else symbol = "▼";
			const xm = new THREE.MeshStandardMaterial({ map: displayTexture(symbol), transparent: true });
			xm.map!.needsUpdate = true;
			display.material.splice(4, 1, xm);
			main3d.started = true;
		}
		// only do things when started
		if (main3d.started) {
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
			if (state != State.INSIDE && main3d.floor?.listenUpdate) main3d.floor.update(main3d.scene);
			// initiate movement to another floor
			if (state == State.INSIDE) {
				state = State.WAITING;
				setTimeout(() => {
					main3d.loadFloor();
					if (!poppedState) history.pushState({ floor: main3d.targetFloor }, "", "/" + (main3d.targetFloor == 0 ? "" : Array.from(main3d.floors.keys())[main3d.targetFloor]));
					else poppedState = false;
					main3d.currentFloor = main3d.targetFloor;
					const xm = new THREE.MeshStandardMaterial({ map: displayTexture(main3d.currentFloor), transparent: true });
					xm.map!.needsUpdate = true;
					display.material.splice(4, 1, xm);
		
					Object.values(main3d.objects).forEach(mesh => mesh.position.y += 1000 * diff);
					main3d.camera.position.setY(1000 * main3d.currentFloor);
					main3d.pointLight.position.add(new THREE.Vector3(0, 1000 * diff, 0));
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
		if (!Elevator.DEBUG) {
			// move the camera around
			// 60deg left/right
			// offset.x normalized to 2
			const point = new THREE.Vector3(main3d.camera.position.x - offsets.x * 10 * clamp(1 / main3d.ratio, Math.tan(Math.PI / 6), Math.tan(Math.PI / 3)) - main3d.rotatedX * 10, main3d.camera.position.y + (offsets.y + main3d.rotatedY) * 10, main3d.camera.position.z - 20);
			main3d.camera.lookAt(point);
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
		if (!div.classList.contains("hidden")) main3d.toggleContent(main3d.floor);
		await wait(250);
		if (main3d.camera.position.x != 0 || main3d.camera.position.z != 0) {
			scrollDisplacement = -10000;
			await wait(1500);
		}
		main3d.targetFloor = history.state?.floor ?? 0;
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
		if (main3d.floor.handleWheel(scroll)) {
			scrollDisplacement = 0;
			scrollVelocity = 0;
		}
	}
}

