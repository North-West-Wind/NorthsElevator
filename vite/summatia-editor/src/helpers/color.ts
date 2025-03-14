export function randomDarkHSV() {
	return `hsl(${Math.floor(Math.random() * 360)}, ${Math.round(Math.random() * 100)}%, ${Math.round(Math.random() * 50)}%)`;
}