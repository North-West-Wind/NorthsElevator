import EventEmitter from "events";

export class Cached<T> {
	private static emitter = new EventEmitter();

	static clearCache() {
		this.emitter.emit("clear");
	}

	private readonly ttl: number;
	private readonly factory: () => T;
	private obtained?: T;
	private obtainmentTime: number;

	constructor(ttl: number, factory: () => T) {
		this.ttl = ttl;
		this.factory = factory;
		this.obtainmentTime = 0;
		Cached.emitter.on("clear", () => this.obtainmentTime = 0);
	}

	get() {
		if (!this.obtained || Date.now() - this.obtainmentTime > this.ttl) {
			this.obtained = this.factory();
			this.obtainmentTime = Date.now();
		}
		return this.obtained;
	}
}