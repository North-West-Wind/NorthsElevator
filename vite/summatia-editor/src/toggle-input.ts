export function createToggleInput(value: string, onCommit: (value: string) => void, onClick: () => void) {
	let edit = false;
	const setEdit = (b: boolean) => {
		edit = b;
		div.style.cursor = b ? "pointer" : "";
		button.innerHTML = b ? "Save" : "Edit";
		input.disabled = !b;
		if (b) {
			input.classList.add("edit");
			input.focus();
		} else input.classList.remove("edit");
	}
	const div = document.createElement("div");
	div.className = "togglable-input";
	div.onclick = () => {
		if (!edit)
			onClick();
	};
	const button = document.createElement("div");
	button.className = "button";
	button.onclick = (ev) => {
		ev.stopPropagation();
		setEdit(!edit);
	};
	button.innerHTML = "Edit";

	const input = document.createElement("input");
	input.value = value;
	input.onkeydown = (ev) => {
		if (ev.key == "Enter" && edit) {
			setEdit(false);
			onCommit((ev.currentTarget as HTMLInputElement).value);
		}
	}
	input.onclick = (ev) => {
		ev.stopPropagation();
		setEdit(true);
	};
	
	div.appendChild(button);
	div.appendChild(input);
	return div;
}