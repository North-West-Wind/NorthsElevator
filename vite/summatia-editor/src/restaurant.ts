import { Emotion } from "./types/bitfield";

let svg: string | undefined;
const res = await fetch("/assets/background/4-restaurant.svg");
if (res.ok) svg = await res.text();

// Setup checkboxes
const checkboxDiv = document.getElementById("emotion-edit") as HTMLDivElement;
const checkboxes: HTMLInputElement[] = [];
for (const key of Object.keys(Emotion)) {
	if (typeof key === "number" || !isNaN(Number(key))) continue;
	const val = Emotion[key as keyof typeof Emotion];
	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	const label = document.createElement("label");
	label.innerHTML = key.toLowerCase().replace(/_/g, " ");
	checkboxDiv.appendChild(checkbox);
	checkboxDiv.appendChild(label);
	checkboxDiv.appendChild(document.createElement("br"));
	checkboxes.push(checkbox);
	// Setup toggle function
}


export function setEmotion(emotions: number) {
	const div = document.createElement("div");
	div.innerHTML = svg!;

	(div.querySelector("#eye") as HTMLElement).style.display = emotions & (1 + 2) ? "inline" : "none";
	(div.querySelector("#eye-half") as HTMLElement).style.display = emotions & (4 + 8) ? "inline" : "none";
	div.querySelectorAll(".eye-open").forEach(item => (item as HTMLElement).style.display = emotions & (1 + 4) ? "inline" : "none");
	div.querySelectorAll(".eye-close").forEach(item => (item as HTMLElement).style.display = emotions & (2 + 8) ? "inline" : "none");

	(div.querySelector("#mouth-smile") as HTMLElement).style.display = emotions & (16) ? "inline" : "none";
	(div.querySelector("#mouth-sad") as HTMLElement).style.display = emotions & (32) ? "inline" : "none";
	(div.querySelector("#mouth-laugh") as HTMLElement).style.display = emotions & (64) ? "inline" : "none";
	(div.querySelector("#mouth-mad") as HTMLElement).style.display = emotions & (128) ? "inline" : "none";

	(div.querySelector("#blush") as HTMLElement).style.opacity = emotions & (256) ? "1" : "0";

	div.querySelector<SVGGElement>("#brows-angry")!.style.display = emotions & Emotion.BROWS_ANGRY ? "inline" : "none";
	div.querySelector<SVGGElement>("#brows-worried")!.style.display = emotions & Emotion.BROWS_WORRIED ? "inline" : "none";
	div.querySelector<SVGGElement>("#brows")!.style.display = !(emotions & (Emotion.BROWS_ANGRY | Emotion.BROWS_WORRIED)) ? "inline" : "none";

	div.querySelectorAll(".summatia-head").forEach(item => (item as HTMLElement).style.transform = `translateY(${emotions & 2048 ? "5" : "0"}px)`);

	(div.querySelector("#hands-table") as HTMLElement).style.display = emotions & (4096) ? "inline" : "none";
	(div.querySelector("#hands-hold") as HTMLElement).style.display = emotions & (8192) ? "inline" : "none";
	(div.querySelector("#hands-face") as HTMLElement).style.display = emotions & (16384) ? "inline" : "none";

	if (emotions & 32768)
		div.querySelectorAll(".pupil").forEach(item => (item as HTMLElement).style.transform = "translateY(18px)");
	else if (emotions & 131072) {
		div.querySelectorAll(".left-pupil").forEach(item => (item as HTMLElement).style.transform = "translate(-14px, 9px)");
		div.querySelectorAll(".right-pupil").forEach(item => (item as HTMLElement).style.transform = "translate(-24px, 9px)");
	} else if (emotions & 262144) {
		div.querySelectorAll(".left-pupil").forEach(item => (item as HTMLElement).style.transform = "translate(20px, 9px)");
		div.querySelectorAll(".right-pupil").forEach(item => (item as HTMLElement).style.transform = "translate(13px, 9px)");
	} else
		div.querySelectorAll(".pupil").forEach(item => (item as HTMLElement).style.transform = "");

	div.querySelectorAll(".tears").forEach(item => (item as HTMLElement).style.opacity = emotions & (1 << 19) ? "1" : "0");


	for (const key of Object.keys(Emotion)) {
		if (typeof key === "number" || !isNaN(Number(key))) continue;
		const val = Emotion[key as keyof typeof Emotion];
		checkboxes[Math.log2(val)].checked = !!(emotions & val);
	}
}