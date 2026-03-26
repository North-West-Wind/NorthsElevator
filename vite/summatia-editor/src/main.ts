import './app.css'
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from './types/summatia';
import { randomRGB } from './helpers/color';
import { Bodies, Body, Composite, Constraint, Engine, Events, Mouse, MouseConstraint, Render, Runner } from "matter-js";
import { download, save } from './helpers/data';
import { wait } from './helpers/control';
import "./restaurant";

// Setup Matter.js and canvas
const engine = Engine.create({ gravity: { scale: 0 } });
const render = Render.create({
	element: document.body,
	engine,
});

render.options.wireframes = false;
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
	mouse,
	constraint: {
		stiffness: 0.2,
		render: { visible: false }
	}
});

Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

const onResize = () => {
	Render.lookAt(render, [{
		min: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
		max: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
	}]);
	render.options.width = window.innerWidth;
	render.options.height = window.innerHeight;
	render.canvas.width = window.innerWidth;
	render.canvas.height = window.innerHeight;
	Render.setPixelRatio(render, window.devicePixelRatio);
	render.mouse.pixelRatio = render.options.pixelRatio!;
};
onResize();

// Setup Summatia data
const data = await Summatia.getInstance();
let entries = 0;
let currentColor = randomRGB();
const bodies = new Map<string, Body>();

// recursive DFS
const processKey = async (key: string, parent?: string) => {
	const conversation = data.conversation.get(key);
	if (!conversation) return;

	if (bodies.has(key)) {
		if (parent) {
			const constraint = Constraint.create({
				bodyA: bodies.get(parent),
				bodyB: bodies.get(key),
				stiffness: 0.01,
				length: 40,
				render: {
					strokeStyle: "#ffffff3f",
					anchors: false,
					type: "line"
				}
			});
			Composite.add(engine.world, constraint);
		}
		return;
	}

	if (!parent) {
		const circle = Bodies.circle(200 * entries++, 0, 10, { isStatic: true, render: {
			fillStyle: "#fff",
			strokeStyle: "#777",
			lineWidth: 2,
			visible: true,
			opacity: 1
		}});
		// @ts-ignore: extra info
		circle.conversation = key;
		bodies.set(key, circle);
		Composite.add(engine.world, circle);
	} else {
		const circle = Bodies.circle(0, bodies.get(parent)!.position.y + 50, 10, { render: {
			fillStyle: currentColor,
			lineWidth: 0,
			visible: true,
			opacity: 1
		}});
		// @ts-ignore: extra info
		circle.conversation = key;

		const constraint = Constraint.create({
			bodyA: bodies.get(parent),
			bodyB: circle,
			stiffness: 0.01,
			length: 40,
			render: {
				strokeStyle: "#ffffff7f",
				anchors: false,
				type: "line"	
			}
		});
		bodies.set(key, circle);
		Composite.add(engine.world, [circle, constraint]);
	}

	if ((conversation as any).next) {
		await wait(10);
		await processKey((conversation as SummatiaConversationLinear).next, key);
	} else if ((conversation as any).responses) {
		const branch = conversation as SummatiaConversationBranch;
		for (let ii = 0; ii < branch.responses.length; ii++) {
			currentColor = randomRGB();
			const res = branch.responses[ii];
			await wait(10);
			await processKey(res.next, key);
		}
	}
};

for (const entry of data.entryPoints) {
	currentColor = randomRGB();
	await processKey(entry);
}

// Matter.js events
let id: string;
Events.on(engine, "beforeUpdate", () => {
	const arr = Array.from(bodies.values());
	arr.forEach((bodyA, ii) => {
		arr.forEach((bodyB, jj) => {
			if (ii == jj) return;
			const deltaX = bodyA.position.x - bodyB.position.x;
			const deltaY = bodyA.position.y - bodyB.position.y;
			const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			const magnitude = 1 / (distance * distance);
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

Events.on(mouseConstraint, "startdrag", (ev) => {
	const body = ev.source.body;
	if (!body) return;
	// @ts-ignore: extra key
	const key = body.conversation as string;
	if (!key) return;
	id = key;
});

// Window event setup
window.onpopstate = (ev) => {
	id = ev.state.id || "";
};

window.onkeydown = (ev) => {
	if (!data) return;
	if (ev.ctrlKey) {
		switch (ev.key) {
			case "s":
				ev.preventDefault();
				save();
				break;
			case "e":
				// download file
				ev.preventDefault();
				download();
				break;
		}
	}
};

window.onwheel = (ev) => {
	render.bounds.min.x += ev.deltaX;
	render.bounds.max.x += ev.deltaX;
	render.bounds.min.y += ev.deltaY;
	render.bounds.max.y += ev.deltaY;
	Render.lookAt(render, [render.bounds]);
};

window.addEventListener("resize", onResize);