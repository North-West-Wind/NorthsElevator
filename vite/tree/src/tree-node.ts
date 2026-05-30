import { Bodies, Body, Composite, Constraint, Engine } from "matter-js";

export type Options = {
	fixed: boolean,
	position: { x: number, y: number },
	radius: number,
	parent: TreeNode,
	style: { color?: string, img?: string | HTMLImageElement, imgScale?: number, noClip?: boolean },
	tooltip: { title: string, subtitle: string, link?: string }
}

export default class TreeNode {
	readonly id: string;
	readonly engine: Engine;
	scale: number;
	radius: number;
	style: { color: string, img?: HTMLImageElement, imgScale: number, noClip: boolean };
	tooltip: Options["tooltip"];
	parent?: TreeNode;
	children: Map<string, TreeNode>;
	
	body: Body;
	constraint?: Constraint;
	private ticks: number;

	constructor(engine: Engine, scale: number, options: Partial<Options> = {}) {
		this.id = crypto.randomUUID();
		this.engine = engine;
		this.radius = options.radius || 10;
		this.scale = 1;
		this.style = {
			color: options.style?.color || "#fff",
			img: options.style?.img ? (() => {
				if (typeof options.style.img == "string") {
					const img = new Image();
					img.src = options.style.img;
					return img
				} else return options.style.img;
			})() : undefined,
			imgScale: options.style?.imgScale || 1,
			noClip: !!options.style?.noClip
		};
		this.tooltip = options?.tooltip || { title: "", subtitle: "" };

		this.ticks = 0;
		this.body = Bodies.circle(
			options.position?.x || (Math.random() * this.radius * this.scale + (options.parent?.body.position.x || 0)),
			options.position?.y || (Math.random() * this.radius * this.scale + (options.parent?.body.position.y || 0)),
			this.radius,
			{ isStatic: !!options.fixed }
		);
		this.resize(scale);
		Composite.add(engine.world, this.body);

		this.children = new Map();
		this.setParent(options.parent);
	}
	
	setParent(parent?: TreeNode) {
		if (this.constraint)
			Composite.remove(this.engine.world, this.constraint);

		this.parent?.children.delete(this.id);
		if (parent !== undefined) {
			parent.children.set(this.id, this);
			this.constraint = Constraint.create({
				bodyA: this.body,
				bodyB: parent.body,
				stiffness: 0.01,
				length: 0.2 * this.scale,
				render: {
					strokeStyle: "#ffffff7f",
					anchors: false,
					type: "line"	
				}
			});
			Composite.add(this.engine.world, this.constraint);
		}
		this.parent = parent;
	}

	render(ctx: CanvasRenderingContext2D) {
		this.ticks += 0.005;
		if (this.parent) {
			ctx.globalCompositeOperation = "destination-over";
			ctx.strokeStyle = this.style.color || "#fff";
			ctx.setLineDash([]);
			ctx.beginPath();
			ctx.lineWidth = this.radius * this.scale * 0.1;
			ctx.moveTo(this.body.position.x, this.body.position.y);
			ctx.lineTo(this.parent.body.position.x, this.parent.body.position.y);
			ctx.stroke();
			ctx.globalCompositeOperation = "source-over";
		}
		ctx.beginPath();
		ctx.arc(this.body.position.x, this.body.position.y, this.radius * this.scale, this.ticks, this.ticks + Math.PI * 2);
		if (this.body.isStatic) {
			ctx.strokeStyle = this.style.color || "#fff";
			ctx.lineWidth = this.radius * this.scale * 0.25;
			ctx.setLineDash([this.radius * this.scale * 0.44, this.radius * this.scale * 0.45]);
			ctx.fillStyle = "#000";
			ctx.fill()
			ctx.stroke();
		} else {
			ctx.fillStyle = this.style.color || "#fff";
			ctx.fill();
		}
		if (this.style.img?.complete) {
			const factored = this.radius * this.scale * 0.8;
			if (!this.style.noClip) {
				ctx.save();
				ctx.beginPath()
				ctx.arc(this.body.position.x, this.body.position.y, factored, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.clip();
			}

			let width: number, height: number;
			if (this.style.img.width > this.style.img.height) {
				width = factored * 2;
				height = factored * 2 * this.style.img.height / this.style.img.width;
			} else {
				height = factored * 2;
				width = factored * 2 * this.style.img.width / this.style.img.height;
			}
			width *= this.style.imgScale;
			height *= this.style.imgScale;
			ctx.drawImage(this.style.img, this.body.position.x - width / 2 , this.body.position.y - height / 2, width, height);
			if (!this.style.noClip)
				ctx.restore();
		}
		this.children.forEach(child => child.render(ctx));
	}

	nodeAtPosition(x: number, y: number): TreeNode | undefined {
		const offX = x - this.body.position.x;
		const offY = y - this.body.position.y;
		const distSqr = offX * offX + offY * offY;
		if (distSqr <= this.radius * this.radius * this.scale * this.scale) return this;
		for (const child of this.children.values()) {
			const node = child.nodeAtPosition(x, y);
			if (node) return node;
		}
		return undefined;
	}

	resize(scale: number) {
		Body.scale(this.body, scale / this.scale, scale / this.scale);
		if (this.constraint) {
			const old = this.constraint;
			this.constraint = Constraint.create({
				bodyA: old.bodyA!,
				bodyB: old.bodyB!,
				stiffness: old.stiffness,
				length: 0.2 * scale,
				render: old.render
			});
			Composite.add(this.engine.world, this.constraint);
			Composite.remove(this.engine.world, old);
			console.log(this.constraint.length);
		}
		this.scale = scale;
		this.children?.forEach(child => child.resize(scale));
	}
}