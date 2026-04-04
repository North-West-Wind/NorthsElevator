import { cacheApiConfig, wait } from "../helpers/control";
import Elevator from "../main";
import { setupHandlers } from "./handle2d";

export class Main2D extends Elevator {
	readonly background = document.querySelector<HTMLDivElement>("#background")!;
	readonly elevator = document.querySelector<HTMLDivElement>("#elevator")!;
	readonly info = document.querySelector<HTMLDivElement>("#info")!;
	readonly stampDiv = document.querySelector<HTMLDivElement>("div[web-stamp]")!;
	readonly upButton = document.querySelector<SVGTextPathElement>("#up-button")!;
	readonly downButton = document.querySelector<SVGTextPathElement>("#down-button")!;
	readonly floorButton = document.querySelector<SVGGElement>("#display")!;
	readonly leftDoor = document.querySelector<SVGRectElement>("#left-door")!;
	readonly rightDoor = document.querySelector<SVGRectElement>("#right-door")!;
	readonly floorDisplay = document.querySelector<SVGTSpanElement>("#floor")!;
	readonly musicButton = document.querySelector<SVGGElement>("#speaker-button")!;
	readonly musicLight = document.querySelector<SVGCircleElement>("#speaker-light")!;
	readonly donationBox = document.querySelector<SVGGElement>("#donation")!;
	readonly suggestionBox = document.querySelector<SVGGElement>("#suggestion-box")!;
	readonly smoothScroll = document.querySelector<SVGGElement>("#smooth-scroll")!;
	readonly yesSmooth = document.querySelector<SVGPathElement>("#yes-smooth")!;
	readonly noSmooth = document.querySelector<SVGPathElement>("#no-smooth")!;
	readonly threeDimension = document.querySelector<SVGGElement>("#three-dim")!;
	readonly stamp = document.querySelector<SVGGElement>("#stamp")!;

	moving = 0; // 1 means up, -1 means down, 0 means not moving
	state = 0; // 0 inside, 1 opening, 2 zooming, 3 htmling, 4 backing, 5 stay, 6 closing
	elevatorScale = 1; // scale for resizing

	constructor() {
		super(true);
	}

	// update floor display
	updateDisplay() {
		if (this.moving > 0) this.floorDisplay.innerHTML = "▲";
		else if (this.moving < 0) this.floorDisplay.innerHTML = "▼";
		else if (this.targetFloor == 0) this.floorDisplay.innerHTML = "G";
		else if (this.targetFloor < 0 || this.targetFloor >= this.floors.size) this.floorDisplay.innerHTML = "?";
		else this.floorDisplay.innerHTML = "" + this.targetFloor;
	}

	protected async dynamicLoad() {
		this.background.innerHTML = await this.floor.svg.get();
		this.floor.loadSvg(this.background);
	}

	protected dynamicUnload() {
		this.floor.unloadSvg(this.background);
	}

	// transition from state 0 to 3
	async anyToThree() {
		if (this.state == 0) {
			const audio = new Audio('/assets/sounds/lift.mp3');
			audio.play();
			this.state = 1;
			this.leftDoor.style.transform = "translateX(-25%)";
			this.rightDoor.style.transform = "translateX(25%)";
			await wait(1500);
		}
		this.state = 2;
		// in case touch offset is happening
		this.elevator.style.transitionDuration = "";
		this.elevator.style.transitionTimingFunction = "";
		this.background.style.transitionDuration = "";
		this.background.style.transitionTimingFunction = "";
		const rect = this.leftDoor.getBoundingClientRect();
		const scale = Math.max(window.innerWidth / (rect.width * 2), window.innerHeight / rect.height);
		this.elevatorScale = scale;
		this.elevator.style.transform = `scale(${scale}, ${scale})`;
		this.background.style.transform = "scale(1.2, 1.2)";
		await wait(1500);
		this.state = 3;
		this.elevator.classList.add("hidden");
		if (!this.floor?.disableContent) this.toggleContent(this.floor);
		else this.floor.skipContent();
	}

	// transition from state 3 to 5
	async threeToFive() {
		this.elevator.classList.remove("hidden");
		await wait(500);
		this.state = 4;
		this.elevator.style.transform = "";
		this.background.style.transform = "";
		this.elevatorScale = 1;
		await wait(1500);
		this.state = 5;
	}

	// transition from state 5 to 0
	async fiveToZero() {
		this.state = 6;
		this.leftDoor.style.transform = "";
		this.rightDoor.style.transform = "";
		await wait(1500);
		this.state = 0;
	}

	protected toggleContentInject() {
		this.threeToFive();
	}
}

export default async function init2D() {
	// Cache /api/config
	await cacheApiConfig();
	try {
		// Change to 2D
		const canvas = document.querySelector("canvas")!;

		const bgDiv = document.createElement("div");
		bgDiv.id = "background";
		bgDiv.classList.add("background");

		const elevatorDiv = document.createElement("div");
		elevatorDiv.id = "elevator";
		elevatorDiv.classList.add("background");

		const res = await fetch("/assets/background/elevator.svg");
		if (!res.ok) throw new Error("SVG not OK");
		else {
			let elevatorSvg = await res.text();
			// Remove top xml line
			elevatorSvg = elevatorSvg.replace(/<\?xml .*\?>\n/, "");
			// Set correct viewBox
			elevatorSvg = elevatorSvg.replace(/viewBox="(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (?:-?\d+(?:\.\d+)?) (?:-?\d+(?:\.\d+)?)"/, `viewBox="$1 $2 708 285.75"`);
			// Remove width and height of svg
			const svgTag = elevatorSvg.match(/<svg(\n\s*[\w:]*=("|').*("|'))*>/);
			if (svgTag)
				elevatorSvg = elevatorSvg.replace(svgTag[0], svgTag[0].replace(/(\n)?\s*(width|height)=("|')\d+(\.\d+)?("|')/g, ""));

			elevatorDiv.innerHTML = elevatorSvg;
			const movable = canvas.parentElement as HTMLDivElement;
			movable.style.position = "initial";
			movable.insertBefore(bgDiv, canvas.nextSibling);
			movable.insertBefore(elevatorDiv, bgDiv.nextSibling);
			canvas.remove();

			const main2d = new Main2D();
			setupHandlers(main2d);
		}
	} catch (err) {
		console.error(err);
		alert("Everything failed to load :<");
	}
}