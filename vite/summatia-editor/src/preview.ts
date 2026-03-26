import { createToggleInput } from "./toggle-input";
import { Summatia } from "./types/summatia";

const previewText = document.getElementById("preview-text") as HTMLDivElement;

export async function updatePreview(entry: string) {
	previewText.innerHTML = "";
	const conv = (await Summatia.getInstance()).conversation.get(entry);
	if (!conv) return;

	previewText.appendChild(createToggleInput(entry, ))

	// @ts-ignore
	if (conv.next) {

	}
}