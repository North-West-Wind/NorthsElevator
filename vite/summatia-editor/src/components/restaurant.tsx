import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import { Emotion } from "../types/bitfield";

let svg: string | undefined;

export default function Restaurant(props: { children: JSX.Element, emotion: number, toggleLarge: () => void, onToggleCheck: (bit: number) => void }) {
	const [svgData, setSvgData] = useState("");
	const [checkboxes, setCheckboxes] = useState<JSX.Element[]>([]);

	useEffect(() => {
		(async () => {
			if (!svg) {
				const res = await fetch("/assets/background/4-restaurant.svg");
				if (res.ok) svg = await res.text();
			}
			const div = document.createElement("div");
			div.innerHTML = svg!;
			const emotions = props.emotion;
		
			(div.querySelector("#eye") as HTMLElement).style.display = emotions & (1 + 2) ? "inline" : "none";
			(div.querySelector("#eye-half") as HTMLElement).style.display = emotions & (4 + 8) ? "inline" : "none";
			div.querySelectorAll(".eye-open").forEach(item => (item as HTMLElement).style.display = emotions & (1 + 4) ? "inline" : "none");
			div.querySelectorAll(".eye-close").forEach(item => (item as HTMLElement).style.display = emotions & (2 + 8) ? "inline" : "none");
		
			(div.querySelector("#mouth-smile") as HTMLElement).style.display = emotions & (16) ? "inline" : "none";
			(div.querySelector("#mouth-sad") as HTMLElement).style.display = emotions & (32) ? "inline" : "none";
			(div.querySelector("#mouth-laugh") as HTMLElement).style.display = emotions & (64) ? "inline" : "none";
			(div.querySelector("#mouth-mad") as HTMLElement).style.display = emotions & (128) ? "inline" : "none";
		
			(div.querySelector("#blush") as HTMLElement).style.opacity = emotions & (256) ? "1" : "0";
		
			if (emotions & (512 + 1024)) {
				(div.querySelector(".left-brow") as HTMLElement).style.transform = `rotate(${emotions & 512 ? "-10" : "20"}deg)`;
				(div.querySelector(".right-brow") as HTMLElement).style.transform = `rotate(${emotions & 512 ? "10" : "-20"}deg)`;
			} else
				div.querySelectorAll(".brow").forEach(item => (item as HTMLElement).style.transform = "");
		
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

			setSvgData('data:image/svg+xml;base64,' + btoa(div.innerHTML));
		})();

		const checkboxes: JSX.Element[] = [];
		for (const key of Object.keys(Emotion)) {
			if (typeof key === "number" || !isNaN(Number(key))) continue;
			const val = Emotion[key as keyof typeof Emotion];
			checkboxes.push(<>
				<input type="checkbox" checked={!!(val & props.emotion)} onClick={() => props.onToggleCheck(val)} />
				<label onClick={() => props.onToggleCheck(val)}>{key.toLowerCase().replace(/_/g, " ")}</label>
				<br />
			</>);
		}
		setCheckboxes(checkboxes);
	}, [props.emotion]);

	return <div className="restaurant">
		<img src={svgData} onClick={props.toggleLarge} />
		<div className="emotion-edit">{checkboxes}</div>
		{props.children}
	</div>;
}