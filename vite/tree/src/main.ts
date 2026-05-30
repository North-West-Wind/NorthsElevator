import { Body, Composite, Engine, Events, Mouse, MouseConstraint, Runner } from "matter-js";
import TreeNode from "./tree-node";
import "./style.css";
import Vec from "./vec";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d")!;

let scale = 1;

const engine = Engine.create({ gravity: { x: 0, y: 0 } });
const runner = Runner.create();
const root = new TreeNode(engine, scale, {
	fixed: true,
	position: { x: canvas.width / 2, y: canvas.height / 2 },
	radius: 0.04,
	tooltip: {
		title: "Root",
		subtitle: "<s>Deltarune reference?</s>"
	}
});

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	scale = Math.min(canvas.width, canvas.height);
	if (root) {
		Body.setPosition(root.body, { x: canvas.width / 2, y: canvas.height / 2 });
		root.resize(scale);
	}
}

resize();
window.addEventListener("resize", resize);

let vector = new Vec(0.02 * scale, 0);
const h2s = document.querySelectorAll("#noscript h2");
const angleIncrement = Math.PI * 2 / h2s.length;
h2s.forEach(h2 => {
	const group = new TreeNode(engine, scale, {
		radius: 0.04,
		parent: root,
		position: vector.add(root.body.position),
		style: JSON.parse(h2.getAttribute("data-style")!),
		tooltip: {
			title: h2.innerHTML,
			subtitle: "Group"
		}
	});
	vector = vector.rotate(angleIncrement);

	if (h2.nextElementSibling?.tagName == "UL") {
		let groupVec = new Vec(0.03 * scale, 0);
		const lis = h2.nextElementSibling.querySelectorAll("li");
		const angleIncrement = Math.PI * 2 / lis.length;
		lis.forEach(li => {
			const anchor = li.querySelector("a")!;
			new TreeNode(engine, scale, {
				radius: 0.06,
				parent: group,
				position: groupVec.add(group.body.position),
				style: {
					img: li.querySelector("img"),
					...JSON.parse(li.getAttribute("data-style")!)
				},
				tooltip: {
					title: anchor.innerHTML,
					subtitle: li.querySelector("p")!.innerHTML,
					link: anchor.href
				}
			});
			groupVec = groupVec.rotate(angleIncrement);
		});
	}
});

const tooltip = document.getElementById("noscript")!;
tooltip.id = "tooltip";
tooltip.innerHTML = "<h1></h1><h2></h2><a></a>";

// Become unhinged
{
	const div = document.createElement("div");
	div.id = "lol";
	div.innerHTML = "link tree?<br>more like stink tree<br>lmao";
	document.body.appendChild(div);
}

function render() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	root.render(ctx);

	requestAnimationFrame(render);
}
render();
Runner.run(runner, engine);

const start = Date.now();
Events.on(engine, "beforeUpdate", () => {
	if (Date.now() - start < 1000) return;
	const bodies: Body[] = [];
	const recurseNode = (node: TreeNode) => {
		bodies.push(node.body);
		node.children.forEach(child => recurseNode(child));
	};
	recurseNode(root);
	bodies.forEach((bodyA, ii) => {
		bodies.forEach((bodyB, jj) => {
			if (ii == jj) return;
			const deltaX = bodyA.position.x - bodyB.position.x;
			const deltaY = bodyA.position.y - bodyB.position.y;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || Math.random();

			const magnitude = 0.01 * scale / (distance * distance);
			const directionX = deltaX / distance;
			const directionY = deltaY / distance;
			
			Body.applyForce(bodyA, bodyA.position, {
				x: directionX * magnitude,
				y: directionY * magnitude
			});
			
			Body.applyForce(bodyB, bodyB.position, {
				x: -directionX * magnitude,
				y: -directionY * magnitude
			});
		});
	});
});

let clickedNode: TreeNode | undefined;

const updateTooltip = (node?: TreeNode) => {
	if (node) {
		tooltip.querySelector("h1")!.innerHTML = node.tooltip.title;
		tooltip.querySelector("h2")!.innerHTML = node.tooltip.subtitle;
		const anchor = tooltip.querySelector("a")!;
		if (node.tooltip.link) {
			anchor.href = node.tooltip.link;
			anchor.innerHTML = node.tooltip.link;
			anchor.target = node.tooltip.title;
		} else {
			anchor.href = "";
			anchor.innerHTML = "";
			anchor.target = "";
		}
	} else {
		tooltip.querySelector("h1")!.innerHTML = "Tooltip";
		tooltip.querySelector("h2")!.innerHTML = "Click/Hover on a node!";
		const anchor = tooltip.querySelector("a")!;
		anchor.href = "";
		anchor.innerHTML = "";
		anchor.target = "";
	}
};
updateTooltip(undefined);

const mouse = Mouse.create(canvas);
const mouseConstraint = MouseConstraint.create(engine, {
	mouse,
	constraint: {
		stiffness: 0.2,
		render: { visible: false }
	}
});
Composite.add(engine.world, mouseConstraint);
Events.on(mouseConstraint, "mousemove", (ev) => {
	const node = root.nodeAtPosition(ev.mouse.position.x, ev.mouse.position.y);
	if (!clickedNode && node) updateTooltip(node);
});
Events.on(mouseConstraint, "mousedown", (ev) => {
	clickedNode = root.nodeAtPosition(ev.mouse.position.x, ev.mouse.position.y);
	updateTooltip(clickedNode);
});