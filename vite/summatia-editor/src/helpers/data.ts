import { Summatia } from "../types/summatia";

export async function save() {
	if (!Summatia.hasInstance) return;
	window.localStorage.setItem("summatia-editor", JSON.stringify((await Summatia.getInstance()).toData()));
	alert("Saved to local storage");
};

export async function download() {
	if (!Summatia.hasInstance) return;
	const data = await Summatia.getInstance();
	const element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.toData())));
	element.setAttribute('download', "summatia.json");
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
	window.localStorage.setItem("summatiaData", JSON.stringify(data.toData()));
};