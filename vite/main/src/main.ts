import GalleryFloor from "./floors/gallery";
import GroundFloor from "./floors/ground";
import InfoCenterFloor from "./floors/info_center";
import ModsFloor from "./floors/mods";
import NotFoundFloor from "./floors/not_found";
import RestaurantFloor from "./floors/restaurant";
import SheetMusicFloor from "./floors/sheet_music";
import SkyFarmFloor from "./floors/sky_farm";
import { getApiConfig, wait } from "./helpers/control";
import { fetchText } from "./helpers/reader";
import Floor from "./types/floor";
import { LazyLoader } from "./types/misc";

export default abstract class Elevator {
	static readonly DEBUG = false;
	static INSTANCE?: Elevator;
	static INSTANCE_2D?: Elevator;
	static INSTANCE_3D?: Elevator;
	readonly passedInFloor: number;
	readonly contents = new Map<number, LazyLoader<string>>();
	readonly floors = new Map<string, Floor>();
	readonly statusFloors = new Map<string, Floor>();

	floor: Floor;
	currentFloor: number;
	targetFloor: number;

	private infoDiv = document.getElementById("info") as HTMLDivElement;
	private closer = document.getElementById("closer")!;

	constructor(flat: boolean) {
		const addFloor = (floor: Floor, map = this.floors) => {
			map.set(floor.id, floor);
		};
		
		addFloor(new GroundFloor());
		addFloor(new InfoCenterFloor());
		addFloor(new ModsFloor());
		addFloor(new SkyFarmFloor());
		addFloor(new RestaurantFloor());
		addFloor(new SheetMusicFloor());
		addFloor(new GalleryFloor());
		
		addFloor(new NotFoundFloor(), this.statusFloors);
		
		for (const floor of Array.from(this.floors.values()).concat(Array.from(this.statusFloors.values())))
			this.contents.set(floor.num, new LazyLoader(() => fetchText(`/contents/${floor.num}-${floor.id}.html`)));
		
		this.contents.set(1000, new LazyLoader(() => fetchText(`/contents/elevator/donation.html`)));
		this.contents.set(1001, new LazyLoader(() => fetchText(`/contents/elevator/suggestion.html`)));
		this.contents.set(1002, new LazyLoader(async () => {
			let text = await fetchText(`/contents/elevator/buttons.html`);
			const buttons: string[] | undefined = getApiConfig()?.buttons;
			if (buttons?.length) {
				let myButtons = "", otherButtons = "";
				const me = ["northwestw.in", "blog.northwestw.in"];
				for (const button of buttons) {
					const link = button.split(".").slice(0, -1).join(".");
					const tag = `<a href="https://${link}" target="${link}"><img src="/assets/images/buttons/${button}" /></a>`;
					if (me.includes(link)) myButtons += tag;
					else otherButtons += tag;
				}
				text = text.replace("{my-buttons}", myButtons);
				text = text.replace("{other-buttons}", otherButtons);
			}
			return text;
		}));

		this.closer.onclick = () => {
			if (!this.infoDiv.classList.contains('hidden')) this.toggleContent();
		}

		let key = window.location.pathname.split("/")[1];
		if (key == "d") key = "ground";
		this.passedInFloor = ((Array.from(this.floors.keys()).indexOf(key || "ground") + 1) || (404 + 1)) - 1;
		this.currentFloor = this.targetFloor = this.passedInFloor;
		this.floor = this.realOrNotFoundFloor(this.targetFloor);
		// There should be no need to reset instance
		Elevator.INSTANCE = this;
		if (flat) Elevator.INSTANCE_2D = this;
		else Elevator.INSTANCE_3D = this;
	}

	realOrNotFoundFloor(index: number) {
		if (index < 0 || index >= this.floors.size) return this.statusFloors.get("not-found")!;
		else return Array.from(this.floors.values())[index];
	}

	// load target floor and unload the last one
	async loadFloor() {
		this.dynamicUnload();
		this.floor = this.realOrNotFoundFloor(this.targetFloor);
		this.currentFloor = this.targetFloor;
		this.dynamicLoad();
	}

	protected abstract dynamicLoad(): void | Promise<void>;
	protected abstract dynamicUnload(): void;

	async contentById(id: string, special = false) {
		const content = await (special ? this.statusFloors : this.floors).get(id)?.content.get();
		return content || "";
	}
	
	async contentByNum(num: number) {
		const content = await this.contents.get(num)?.get();
		return content || "";
	}
	
	// toggle the closing button for content
	private async toggleCloser() {
		if (this.closer.classList.contains("hidden")) {
			this.closer.classList.remove("hidden");
			await wait(20);
			this.closer.classList.remove("visuallyhidden");
		} else {
			this.closer.addEventListener("transitionend", () => this.closer.classList.add('hidden'), { once: true });
			this.closer.classList.add("visuallyhidden");
		}
	}
	
	async toggleContent(floor?: Floor, html?: string | (() => Promise<string>)) {
		if (this.infoDiv.classList.contains("hidden")) {
			if (html) {
				if (typeof html === "string") this.infoDiv.innerHTML = html;
				else this.infoDiv.innerHTML = await html();
			}
			else this.infoDiv.innerHTML = await floor?.content.get() || "";
			if (floor) {
				floor.loadContent(this.infoDiv);
				floor.functionContent = true;
			}
			this.infoDiv.classList.remove("hidden");
			await wait(20);
			this.infoDiv.classList.remove("visuallyhidden");
			this.toggleCloser();
		} else {
			this.toggleCloser();
			const functional = this.floor.functionContent;
			if (functional) {
				this.floor.unloadContent(this.infoDiv);
				this.floor.functionContent = false;
			}
			this.infoDiv.innerHTML = "";
			if (functional) this.toggleContentInject();
			this.infoDiv.addEventListener("transitionend", () => this.infoDiv.classList.add('hidden'), { once: true });
			this.infoDiv.classList.add("visuallyhidden");
		}
	}

	protected toggleContentInject() {}
}