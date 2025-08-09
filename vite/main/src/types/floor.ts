import * as THREE from "three";
import { LazyLoader } from "./misc";
import { fetchText } from "../helpers/reader";
import Elevator from "../main";
import { Main2D } from "../2d/main2d";
import { Main3D } from "../3d/main3d";

export type Generated = { [key: string]: THREE.Object3D }

export default abstract class Floor {
	id: string;
	num: number;
	svg: LazyLoader<string>;
	content: LazyLoader<string>;
	disableContent = false;
	functionContent = false;

	phase = 0;
	listenClick = false;
	listenMove = false;
	listenUpdate = false;
	special = false;
	protected meshes: Generated;

	constructor(id: string, num: number, loaders?: { svg?: LazyLoader<string>, content?: LazyLoader<string> }) {
		this.id = id;
		this.num = num;
		this.svg = loaders?.svg || new LazyLoader(() => fetchText(`/assets/background/${num}-${id}.svg`));
		this.content = loaders?.content || new LazyLoader(() => fetchText(`/contents/${num}-${id}.html`));
		this.meshes = {};
	}
	
	protected main2d() {
		return Elevator.INSTANCE_2D as Main2D;
	}

	protected main3d() {
		return Elevator.INSTANCE_3D as Main3D;
	}
	
	protected elevator() {
		return Elevator.INSTANCE!;
	}

	// Common
	loadContent(_info: HTMLDivElement) { }
	unloadContent(_info: HTMLDivElement) { }
	skipContent() { }

	// 3D-specific
	abstract spawn(scene: THREE.Scene): Generated | Promise<Generated>;

	async spawnWrapper(scene: THREE.Scene) {
		return this.meshes = await this.spawn(scene);
	}
	
	despawn(scene: THREE.Scene) {
		if (!this.meshes) return;
		for (const ob of Object.values(this.meshes))
			if (ob)
				scene.remove(ob);
		this.meshes = {};
	}

	abstract handleWheel(scroll: number): boolean;

	clickRaycast(_raycaster: THREE.Raycaster): void { }

	moveCheck(): THREE.Object3D[] { return []; }

	update(_scene: THREE.Scene): void { }

	// 2D-Specific
	loadSvg(_bg: HTMLDivElement) { }
	unloadSvg(_bg: HTMLDivElement) { }
}