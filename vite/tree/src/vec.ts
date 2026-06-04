export type VecLike = { x: number, y: number };

export default class Vec {
	readonly x: number;
	readonly y: number;

	static from(vec: VecLike) {
		return new Vec(vec.x, vec.y);
	}

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	add(vec: VecLike) {
		return new Vec(this.x + vec.x, this.y + vec.y);
	}

	rotate(angle: number, counterclockwise = false) {
		if (counterclockwise) angle *= -1;
		return new Vec(this.x * Math.cos(angle) - this.y * Math.sin(angle), this.x * Math.sin(angle) + this.y * Math.cos(angle));
	}
}