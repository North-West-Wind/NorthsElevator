export class Bitfield {
	private value: number;

	constructor(value: number) {
		this.value = value;
	}

	get(emotion: Emotion) {
		return !!(this.value & emotion);
	}

	set(emotion: Emotion, state: boolean) {
		this.value = this.value & (~emotion);
		if (state) this.value = this.value | (emotion);
	}

	num() {
		return this.value;
	}
}

export enum Emotion {
	EYES_NORMAL_OPEN = 1,
	EYES_NORMAL_CLOSED = 1 << 1,
	EYES_HALF_OPEN = 1 << 2,
	EYES_HALF_CLOSED = 1 << 3,
	MOUTH_HAPPY_CLOSED = 1 << 4,
	MOUTH_SAD_CLOSED = 1 << 5,
	MOUTH_HAPPY_OPEN = 1 << 6,
	MOUTH_SAD_OPEN = 1 << 7,
	BLUSH = 1 << 8,
	BROWS_ANGRY = 1 << 9,
	BROWS_WORRIED = 1 << 10,
	HEAD_LOWERED = 1 << 11,
	HANDS_TABLE = 1 << 12,
	HANDS_HEAD = 1 << 13,
	HANDS_FACE = 1 << 14,
	EYES_DOWN = 1 << 15,
	EYES_LEFT = 1 << 16,
	EYES_RIGHT = 1 << 17,
	TEARS = 1 << 18,
}