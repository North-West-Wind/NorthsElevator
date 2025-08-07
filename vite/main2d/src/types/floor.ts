import { fetchText } from "../helpers/reader";
import { LazyLoader } from "./misc";

export default abstract class Floor {
	id: string;
	num: number;
	svg: LazyLoader<string>;
	content: LazyLoader<string>;
	disableContent = false;
	functionContent = false;

	constructor(id: string, num: number, loaders?: { svg?: LazyLoader<string>, content?: LazyLoader<string> }) {
		this.id = id;
		this.num = num;
		this.svg = loaders?.svg || new LazyLoader(() => fetchText(`/assets/background/${num}-${id}.svg`));
		this.content = loaders?.content || new LazyLoader(() => fetchText(`/contents/${num}-${id}.html`));
	}

	loadSvg(_bg: HTMLDivElement) { }
	unloadSvg(_bg: HTMLDivElement) { }

	loadContent(_info: HTMLDivElement) { }
	unloadContent(_info: HTMLDivElement) { }

	enter() { }
}