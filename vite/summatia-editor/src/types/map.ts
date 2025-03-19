export class DoubleMap<A, B> {
	private mapA = new Map<A, B>();
	private mapB = new Map<B, A>();

	hasA(a: A) {
		return this.mapA.has(a);
	}

	hasB(b: B) {
		return this.mapB.has(b);
	}

	getA(a: A) {
		return this.mapA.get(a);
	}

	getB(b: B) {
		return this.mapB.get(b);
	}

	set(a: A, b: B) {
		this.mapA.set(a, b);
		this.mapB.set(b, a);
	}

	deleteA(a: A) {
		const b = this.mapA.get(a);
		if (b) {
			this.mapA.delete(a);
			this.mapB.delete(b);
			return true;
		}
		return false;
	}

	deleteB(b: B) {
		const a = this.mapB.get(b);
		if (a) {
			this.mapA.delete(a);
			this.mapB.delete(b);
			return true;
		}
		return false;
	}

	entries() {
		return this.mapA.entries();
	}
}