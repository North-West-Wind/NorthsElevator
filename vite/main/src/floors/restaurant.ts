import * as THREE from "three";
import Floor from "../types/floor";
import { fetchJson, fetchText } from "../helpers/reader";
import { LazyLoader } from "../types/misc";
import { getConfig, setMusic, wait, writeConfig } from "../helpers/control";
import { randomBetween } from "../helpers/math";

type FireEntry = {
	mesh: THREE.Mesh;
	direction: THREE.Vector3;
}

const FIRE_COLOR = [
	0xffc003,
	0xff5500,
	0xff5917
];

enum Phase {
	INITIAL,
	TRANSITION,
	DATING,
	DATING_BACK
}

enum FaceComponent {
	EYES_NORMAL_OPEN = 1,
	EYES_NORMAL_CLOSE = 1 << 1,
	EYES_HALF_OPEN = 1 << 2,
	EYES_HALF_CLOSE = 1 << 3,
	MOUTH_SMILE_CLOSE = 1 << 4,
	MOUTH_SAD_CLOSE = 1 << 5,
	MOUTH_SMILE_OPEN = 1 << 6,
	MOUTH_SAD_OPEN = 1 << 7,
	FACE_BLUSH = 1 << 8,
	BROWS_ANGRY = 1 << 9,
	BROWS_WORRIED = 1 << 10,
	HEAD_LOWERED = 1 << 11,
	HANDS_TABLE = 1 << 12,
	HANDS_HEAD = 1 << 13,
	HANDS_FACE = 1 << 14,
	EYES_DOWN = 1 << 15,
	EYES_LEFT = 1 << 17,
	EYES_RIGHT = 1 << 18,
	FACE_TEARS = 1 << 19
};

type SummatiaData = {
	[key: string]: {
		message: string;
		emotion: string | number;
		responses?: { message: string, next: string }[];
		next?: string;
	}
} & { emotions: { [key: string]: number } }

const MUSICS = {
	jazz0: `Music by <a href="https://pixabay.com/users/denis-pavlov-music-35636692/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=168726">Denis Pavlov</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=168726">Pixabay</a>`,
	jazz1: `Music by <a href="https://pixabay.com/users/denis-pavlov-music-35636692/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=219314">Denis Pavlov</a> from <a href="https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=219314">Pixabay</a>`,
	jazz2: `Music by <a href="https://pixabay.com/users/denis-pavlov-music-35636692/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=219302">Denis Pavlov</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=219302">Pixabay</a>`
};

export default class RestaurantFloor extends Floor {
	phase: Phase;
	allFires: FireEntry[] = [];
	candleLightPos: THREE.Vector3;
	covered = true;
	updateCanvas = true;
	covers?: THREE.Mesh[];
	chair?: THREE.Group;
	// canvas for texture
	canvas: HTMLCanvasElement;
	// textures for summatia
	texture: THREE.CanvasTexture;
	handsHoldTexture: LazyLoader<THREE.CanvasTexture>;
	handsTableTexture: LazyLoader<THREE.CanvasTexture>;
	// summatia svg
	summatiaSvg: LazyLoader<string>;
	summatiaData: LazyLoader<SummatiaData>;
	// summatia state
	emotion = 17;
	resets = 0;
	active = false;
	// music stuff
	musicPlaying = false;
	audio!: HTMLAudioElement;

	constructor() {
		super("restaurant", 4);
		this.disableContent = true;
		this.listenUpdate = true;
		this.phase = Phase.INITIAL;
		this.candleLightPos = new THREE.Vector3(0, this.num * 1000 - 4, -100);
		this.canvas = document.createElement("canvas");
		// hardcoded currently, can be dynamic from svg
		this.canvas.width = 443;
		this.canvas.height = 900;
		this.texture = new THREE.CanvasTexture(this.canvas);
		this.handsHoldTexture = new LazyLoader(async () => {
			const svg = await fetchText(`/assets/images/summatia/hands-hold.svg`);
			const img = document.createElement("img");
			return await new Promise(res => {
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = 443;
					canvas.height = 900;
					canvas.getContext("2d")!.drawImage(img, 0, 0);
					const texture = new THREE.CanvasTexture(canvas);
					texture.colorSpace = THREE.SRGBColorSpace;
					res(texture);
				}
				img.src = 'data:image/svg+xml;base64,' + btoa(svg);
			});
		});
		this.handsTableTexture = new LazyLoader(async () => {
			const svg = await fetchText(`/assets/images/summatia/hands-table.svg`);
			const img = document.createElement("img");
			return await new Promise(res => {
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = 443;
					canvas.height = 900;
					canvas.getContext("2d")!.drawImage(img, 0, 0);
					const texture = new THREE.CanvasTexture(canvas);
					texture.colorSpace = THREE.SRGBColorSpace;
					res(texture);
				}
				img.src = 'data:image/svg+xml;base64,' + btoa(svg);
			});
		});
		this.texture.colorSpace = THREE.SRGBColorSpace;
		// svgs
		this.summatiaSvg = new LazyLoader(() => fetchText(`/assets/images/summatia/summatia.svg`));
		this.summatiaData = new LazyLoader(() => fetchJson("/data/summatia.json"));
		this.setupJazz();
	}

	private setupJazz() {
		const key = "jazz" + randomBetween(0, 2);
		this.audio = new Audio(`/assets/sounds/jazz/${key}.mp3`);
		this.audio.onplay = () => {
			const div = document.querySelector<HTMLDivElement>("div#summatia-credits")!;
			div.innerHTML = (MUSICS as any)[key];
			div.style.opacity = "1";
			setTimeout(() => div.style.opacity = "0", 5000);
		}
		this.audio.onended = () => this.setupJazz();
		if (this.phase == Phase.DATING) this.audio.play();
	}

	async spawn(scene: THREE.Scene) {
		/*const floor = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 1000), new THREE.MeshStandardMaterial({ color: 0x120d35 }));
		floor.position.set(0, this.num * 1000 - 40, -100);
		scene.add(floor);*/

		const table = new THREE.Group();
		const tableMat = new THREE.MeshStandardMaterial({ color: 0x824100 });

		const tableTopGeo = new THREE.CylinderGeometry(20, 18, 2, 32);
		const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
		tableTop.position.set(0, this.num * 1000 - 8, -100);
		table.add(tableTop);

		const tableLeg0Geo = new THREE.CylinderGeometry(4, 1, 6, 8);
		const tableLeg0 = new THREE.Mesh(tableLeg0Geo, tableMat);
		tableLeg0.position.set(0, this.num * 1000 - 11, -100);
		table.add(tableLeg0);

		const tableLeg1Geo = new THREE.CylinderGeometry(1, 1, 20, 8);
		const tableLeg1 = new THREE.Mesh(tableLeg1Geo, tableMat);
		tableLeg1.position.set(0, this.num * 1000 - 24, -100);
		table.add(tableLeg1);

		const tableLeg2Geo = new THREE.CylinderGeometry(1, 2, 2, 16);
		const tableLeg2 = new THREE.Mesh(tableLeg2Geo, tableMat);
		tableLeg2.position.set(0, this.num * 1000 - 35, -100);
		table.add(tableLeg2);

		const tableBottomGeo = new THREE.CylinderGeometry(3, 3, 1, 16);
		const tableBottom = new THREE.Mesh(tableBottomGeo, tableMat);
		tableBottom.position.set(0, this.num * 1000 - 36.5, -100);
		table.add(tableBottom);

		const candle = new THREE.Group();

		const candleWaxGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
		const candleWaxMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
		const candleWax = new THREE.Mesh(candleWaxGeo, candleWaxMat);
		candleWax.position.set(0, this.num * 1000 - 5.5, -100);
		candle.add(candleWax);

		const candleHandleMat = new THREE.MeshStandardMaterial({ color: 0x9d8300 });

		const candleHandleTopGeo = new THREE.CylinderGeometry(0.75, 0.5, 0.5, 8);
		const candleHandleTop = new THREE.Mesh(candleHandleTopGeo, candleHandleMat);
		candleHandleTop.position.set(0, this.num * 1000 - 7.25, -100);
		candle.add(candleHandleTop);

		const candleHandleLegGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
		const candleHandleLeg = new THREE.Mesh(candleHandleLegGeo, candleHandleMat);
		candleHandleLeg.position.set(0, this.num * 1000 - 8, -100);
		candle.add(candleHandleLeg);

		const candleHandleBottomGeo = new THREE.CylinderGeometry(0.5, 0.75, 0.5, 8);
		const candleHandleBottom = new THREE.Mesh(candleHandleBottomGeo, candleHandleMat);
		candleHandleBottom.position.set(0, this.num * 1000 - 8.75, -100);
		candle.add(candleHandleBottom);

		candle.translateY(2);
		table.add(candle);
	
		const pointLight = new THREE.PointLight(0xfff8be, 200, 50, 2);
		pointLight.position.set(0, this.num * 1000 - 0.5, -100);
		table.add(pointLight);

		table.translateY(-2);
		scene.add(table);

		const summatia = new THREE.Mesh(new THREE.PlaneGeometry(this.canvas.width / 15, this.canvas.height / 15), new THREE.MeshBasicMaterial({ map: this.texture, transparent: true }));
		summatia.position.set(0, this.num * 1000 - 13, -124);
		scene.add(summatia);

		const handsHold = new THREE.Mesh(new THREE.PlaneGeometry(this.canvas.width / 15, this.canvas.height / 15), new THREE.MeshBasicMaterial({ map: await this.handsHoldTexture.get(), transparent: true }));
		handsHold.position.set(0, this.num * 1000 - 9.5, -110);
		handsHold.scale.set(0.8, 0.8, 0.8);
		handsHold.visible = false;
		scene.add(handsHold);

		const handsTable = new THREE.Mesh(new THREE.PlaneGeometry(this.canvas.width / 15, this.canvas.height / 15), new THREE.MeshBasicMaterial({ map: await this.handsTableTexture.get(), transparent: true }));
		handsTable.position.set(0, this.num * 1000 - 9, -115);
		handsTable.scale.set(0.9, 0.9, 0.9);
		handsTable.visible = false;
		scene.add(handsTable);

		this.chair = new THREE.Group();
		const chairMat = new THREE.MeshStandardMaterial({ color: 0x4d0000 });
		const chairBack = new THREE.Mesh(new THREE.BoxGeometry(12, 16, 2), chairMat);
		chairBack.position.set(0, this.num * 1000 - 13, -70);
		this.chair.add(chairBack);

		const chairLegGeo = new THREE.BoxGeometry(1, 15, 1);
		const chairLegLB = new THREE.Mesh(chairLegGeo, chairMat);
		chairLegLB.position.set(-5.5, this.num * 1000 - 26, -70);
		this.chair.add(chairLegLB);

		const chairLegRB = new THREE.Mesh(chairLegGeo, chairMat);
		chairLegRB.position.set(5.5, this.num * 1000 - 26, -70);
		this.chair.add(chairLegRB);

		const chairLegLF = new THREE.Mesh(chairLegGeo, chairMat);
		chairLegLF.position.set(-5.5, this.num * 1000 - 26, -80);
		this.chair.add(chairLegLF);

		const chairLegRF = new THREE.Mesh(chairLegGeo, chairMat);
		chairLegRF.position.set(5.5, this.num * 1000 - 26, -80);
		this.chair.add(chairLegRF);
		this.chair.translateY(1);

		if (this.phase <= Phase.TRANSITION) {
			const coverGeo = new THREE.PlaneGeometry(200, 200);
			const coverMat = new THREE.MeshBasicMaterial({ color: 0 });
			const cover1 = new THREE.Mesh(coverGeo, coverMat);
			cover1.position.set(0, this.num * 1000, -53);
			const cover2 = new THREE.Mesh(coverGeo, coverMat);
			cover2.position.set(0, this.num * 1000, -77);
			this.covers = [cover1, cover2];
			scene.add(cover1, cover2);
		} else scene.add(this.chair);

		return { table, summatia, handsHold, handsTable, chair: this.chair };
	}

	handleWheel(scroll: number) {
		const cam = this.main3d().camera;
		if (cam.position.y != this.num * 1000) cam.position.y = this.num * 1000;
		if (this.phase == Phase.TRANSITION) return true;
		let maxed = false;
		const maxDist = 76;
		if (this.phase == Phase.INITIAL) {
			cam.translateZ(-scroll);
			if (cam.position.z < -maxDist) {
				this.phase = Phase.TRANSITION;
				cam.position.z = -maxDist;
				maxed = true;
				
				this.musicPlaying = getConfig().music;
				setMusic(false, true);

				setTimeout(() => {
					this.phase = Phase.DATING;
					setTimeout(() => this.main3d().toggleContent(this), 1000);
				}, 3000);
			} else if (cam.position.z > 0) {
				cam.position.z = 0;
				maxed = true;
			}
		} else if (this.phase == Phase.DATING_BACK) {
			cam.translateZ(-scroll);
			if (cam.position.z < -maxDist) {
				this.phase = Phase.TRANSITION;
				cam.position.z = -maxDist;
				maxed = true;
				
				this.musicPlaying = getConfig().music;
				setMusic(false, true);

				setTimeout(() => {
					this.phase = Phase.DATING;
					this.main3d().toggleContent(this);
				}, 1000);
			} else if (cam.position.z > 0) {
				cam.position.z = 0;
				maxed = true;
			}
		}

		cam.position.x = 0;
		cam.position.y = this.num * 1000;

		return maxed;
	}

	private createFire(scene: THREE.Scene, amount: number) {
		const fires: FireEntry[] = [];
		const zAxis = new THREE.Vector3(0, 0, 1);
		const yAxis = new THREE.Vector3(0, 1, 0);
		for (let ii = 0; ii < amount; ii++) {
			const geometryR = new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.1, 0.2));
			const materialR = new THREE.MeshBasicMaterial({ color: FIRE_COLOR[Math.floor(Math.random() * FIRE_COLOR.length)], transparent: true });
			const fire = new THREE.Mesh(geometryR, materialR);
			fire.position.set(this.candleLightPos.x, this.candleLightPos.y, this.candleLightPos.z);
			fires.push({ mesh: fire, direction: new THREE.Vector3(0.1, 0, 0).applyAxisAngle(zAxis, THREE.MathUtils.randFloat(0.5, Math.PI * 0.5)).applyAxisAngle(yAxis, THREE.MathUtils.randFloat(0, Math.PI * 2)) });
			scene.add(fire);
		}
		return fires;
	}

	update(scene: THREE.Scene) {
		if (this.covered && this.phase == Phase.DATING) {
			scene.remove(...this.covers!);
			scene.add(this.chair!);
			this.meshes!.chair = this.chair!;
			this.covered = false;
		}

		const newFires: FireEntry[] = [];
		for (let i = 0; i < this.allFires.length; i++) {
			const r = this.allFires[i];
			const result = r.mesh.position.addScaledVector(r.direction, 0.1);
			r.mesh.position.set(result.x, result.y, result.z);
			const distSqr = r.mesh.position.distanceToSquared(this.candleLightPos);
			if (distSqr > 4) scene.remove(r.mesh);
			else {
				(r.mesh.material as THREE.Material).opacity = 1 - (distSqr / 4);
				newFires.push(r);
			}
		}
		if (this.allFires.length < 2 || Math.random() < 0.01) 
			newFires.push(...this.createFire(scene, 1));
		this.allFires = newFires;

		if (this.updateCanvas) {
			this.updateCanvas = false;
			this.summatiaSvg.get().then(svg => {
				const div = document.createElement("div");
				div.innerHTML = svg;
				this.enableByEmotion(div);
				const img = document.createElement("img");
				img.onload = () => {
					this.canvas.getContext("2d")!.clearRect(0, 0, this.canvas.width, this.canvas.height);
					this.canvas.getContext("2d")!.drawImage(img, 0, 0);
					this.texture.needsUpdate = true;
				}
				img.src = 'data:image/svg+xml;base64,' + btoa(div.innerHTML);
			});

			if (this.meshes.handsTable && this.meshes.handsHold) {
				this.meshes!.handsTable.visible = !!(this.emotion & (FaceComponent.HANDS_TABLE));
				this.meshes!.handsHold.visible = !!(this.emotion & (FaceComponent.HANDS_HEAD));
			} else this.updateCanvas = true;
		}
	}
	
	private enableByEmotion(div?: HTMLDivElement) {
		const svg = this.main2d() ? document.querySelector<SVGElement>("#background svg")! : div!.querySelector<SVGElement>("svg")!;

		svg.querySelector<SVGGElement>("#eye")!.style.display = this.emotion & (FaceComponent.EYES_NORMAL_OPEN | FaceComponent.EYES_NORMAL_CLOSE) ? "inline" : "none";
		svg.querySelector<SVGGElement>("#eye-half")!.style.display = this.emotion & (FaceComponent.EYES_HALF_OPEN | FaceComponent.EYES_HALF_CLOSE) ? "inline" : "none";
		svg.querySelectorAll<SVGGElement>(".eye-open").forEach(item => item.style.display = this.emotion & (FaceComponent.EYES_NORMAL_OPEN | FaceComponent.EYES_HALF_OPEN) ? "inline" : "none");
		svg.querySelectorAll<SVGGElement>(".eye-close").forEach(item => item.style.display = this.emotion & (FaceComponent.EYES_NORMAL_CLOSE | FaceComponent.EYES_HALF_CLOSE) ? "inline" : "none");

		svg.querySelector<SVGPathElement>("#mouth-smile")!.style.display = this.emotion & FaceComponent.MOUTH_SMILE_CLOSE ? "inline" : "none";
		svg.querySelector<SVGPathElement>("#mouth-sad")!.style.display = this.emotion & FaceComponent.MOUTH_SAD_CLOSE ? "inline" : "none";
		svg.querySelector<SVGGElement>("#mouth-laugh")!.style.display = this.emotion & FaceComponent.MOUTH_SMILE_OPEN ? "inline" : "none";
		svg.querySelector<SVGGElement>("#mouth-mad")!.style.display = this.emotion & FaceComponent.MOUTH_SAD_OPEN ? "inline" : "none";

		svg.querySelector<SVGGElement>("#blush")!.style.opacity = this.emotion & FaceComponent.FACE_BLUSH ? "1" : "0";

		if (this.main2d()) {
			if (this.emotion & (FaceComponent.BROWS_ANGRY | FaceComponent.BROWS_WORRIED)) {
				svg.querySelector<SVGPathElement>(".left-brow")!.style.transform = `rotate(${this.emotion & FaceComponent.BROWS_ANGRY ? "-10" : "20"}deg)`;
				svg.querySelector<SVGPathElement>(".right-brow")!.style.transform = `rotate(${this.emotion & FaceComponent.BROWS_ANGRY ? "10" : "-20"}deg)`;
			} else
				svg.querySelectorAll<SVGPathElement>(".brow").forEach(item => item.style.transform = "");

			svg.querySelector<SVGGElement>("#hands-table")!.style.display = this.emotion & FaceComponent.HANDS_TABLE ? "inline" : "none";
			svg.querySelector<SVGGElement>("#hands-hold")!.style.display = this.emotion & FaceComponent.HANDS_HEAD ? "inline" : "none";
		} else {
			svg.querySelector<SVGGElement>("#brows-angry")!.style.display = this.emotion & FaceComponent.BROWS_ANGRY ? "inline" : "none";
			svg.querySelector<SVGGElement>("#brows-worried")!.style.display = this.emotion & FaceComponent.BROWS_WORRIED ? "inline" : "none";
			svg.querySelector<SVGGElement>("#brows")!.style.display = !(this.emotion & (FaceComponent.BROWS_ANGRY | FaceComponent.BROWS_WORRIED)) ? "inline" : "none";
		}

		svg.querySelectorAll<SVGElement>(".summatia-head").forEach(item => item.style.transform = `translateY(${this.emotion & FaceComponent.HEAD_LOWERED ? "5" : "0"}px)`);

		svg.querySelector<SVGGElement>("#hands-face")!.style.display = this.emotion & FaceComponent.HANDS_FACE ? "inline" : "none";

		if (this.emotion & FaceComponent.EYES_DOWN)
			svg.querySelectorAll<SVGPathElement>(".pupil").forEach(item => item.style.transform = "translateY(18px)");
		else if (this.emotion & FaceComponent.EYES_LEFT) {
			svg.querySelectorAll<SVGPathElement>(".left-pupil").forEach(item => item.style.transform = "translate(-14px, 9px)");
			svg.querySelectorAll<SVGPathElement>(".right-pupil").forEach(item => item.style.transform = "translate(-24px, 9px)");
		} else if (this.emotion & FaceComponent.EYES_RIGHT) {
			svg.querySelectorAll<SVGPathElement>(".left-pupil").forEach(item => item.style.transform = "translate(20px, 9px)");
			svg.querySelectorAll<SVGPathElement>(".right-pupil").forEach(item => item.style.transform = "translate(13px, 9px)");
		} else
			svg.querySelectorAll<SVGPathElement>(".pupil").forEach(item => item.style.transform = "");

		svg.querySelectorAll<SVGGElement>(".tears").forEach(item => item.style.opacity = this.emotion & FaceComponent.FACE_TEARS ? "1" : "0");
	}

	loadContent(info: HTMLDivElement) {
		info.style.backgroundColor = "transparent";

		info.querySelector<HTMLDivElement>("#summatia-reset")!.onclick = () => {
			this.resets++;
			getConfig().summatia = "";
			this.next("first");
		}

		const auto = info.querySelector<HTMLDivElement>("#summatia-auto")!;
		auto.querySelector("span")!.innerHTML = "Auto: " + (getConfig().autoSummatia ? "On" : "Off");
		auto.onclick = () => {
			getConfig().autoSummatia = !getConfig().autoSummatia;
			writeConfig();
			auto.querySelector("span")!.innerHTML = "Auto: " + (getConfig().autoSummatia ? "On" : "Off");
		}

		this.next(getConfig().summatia ? "back" : "first");
		this.audio.play();
		if (this.main2d()) {
			setMusic(false, false);
			this.phase = Phase.DATING;
		}
	}

	unloadContent(info: HTMLDivElement) {
		info.style.backgroundColor = "";
		this.phase = Phase.DATING_BACK;
		this.audio.pause();
		if (this.musicPlaying) setMusic(true, false);
	}

	private async next(key: string) {
		const summatiaData = await this.summatiaData.get();
		const data = summatiaData[key];
		if (!data) return;
		let pid = this.resets;
		if (!key.startsWith("back")) {
			// avoid back looping
			getConfig().summatia = key;
			writeConfig();
		}

		this.emotion = typeof data.emotion == "string" ? summatiaData.emotions[data.emotion] : data.emotion;
		if (this.main2d()) this.enableByEmotion();
		else this.updateCanvas = true;

		const ans = document.querySelector<HTMLDivElement>("#summatia-ans")!;
		ans.style.opacity = "0";
		ans.innerHTML = "";

		const say = document.querySelector<HTMLDivElement>("#summatia-say")!;
		let message = "";
		let skipped = false;
		const skipClick = new Promise<boolean>((res) => window.addEventListener("click", () => res(skipped = true), { once: true }));
		for (const char of data.message) {
			if (skipped) {
				message = data.message;
				say.innerHTML = message;
				break;
			}
			message += char;
			say.innerHTML = message;
			await wait(50);
			if ("!,.:;?".includes(char)) await wait(500);
			if (pid != this.resets) return;
		}
		if (data.next) {
			let waitForClick: Promise<any>;
			if (skipped) waitForClick = new Promise<void>((res) => window.addEventListener("click", () => res(), { once: true }));
			else waitForClick = skipClick;
			if (getConfig().autoSummatia) await Promise.race([wait(1000 + data.message.length * 100), waitForClick]);
			else await waitForClick;
		}
		if (pid != this.resets) return;

		if (data.responses) {
			for (const response of data.responses) {
				const div = document.createElement("div");
				div.innerHTML = response.message;
				div.onclick = () => this.next(response.next);
				ans.appendChild(div);
			}
			ans.style.opacity = "1";
		} else if (data.next) this.next(data.next);
		else this.next(this.validKeyOrElse(getConfig().summatia, "first"));
	}

	loadSvg(bg: HTMLDivElement) {
		const cover = bg.querySelector<SVGRectElement>("svg rect#cover")!;
		cover.style.display = "inline";

		this.enableByEmotion();
	}

	async skipContent() {
		this.musicPlaying = getConfig().music;
		setMusic(false, true);
		await wait(3000);
		const cover = document.querySelector<SVGRectElement>("#background svg rect#cover")!;
		cover.style.display = "none";
		await wait(1000);
		this.main2d().toggleContent(this);
	}

	private validKeyOrElse(key: string, fallback: string) {
		const summatiaData = this.summatiaData.got();
		return summatiaData && Object.keys(summatiaData).includes(key) ? key : fallback;
	}
}