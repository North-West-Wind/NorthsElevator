export function randomRGB() {
	const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
	return `#${hex()}${hex()}${hex()}`;
}