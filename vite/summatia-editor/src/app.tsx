import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from './types/summatia';
import { randomRGB } from './helpers/color';
import Preview from './components/preview';
import { Bodies, Body, Composite, Constraint, Engine, Events, Mouse, MouseConstraint, Render, Runner } from "matter-js";

const engine = Engine.create({ gravity: { scale: 0 } });
const render = Render.create({
	canvas: document.querySelector("canvas") as HTMLCanvasElement,
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
	render.options.width = window.innerWidth;
	render.options.height = window.innerHeight;
	render.canvas.width = window.innerWidth;
	render.canvas.height = window.innerHeight;
  Render.setPixelRatio(render, window.devicePixelRatio);
	render.mouse.pixelRatio = render.options.pixelRatio!;
	Render.lookAt(render, [{
		min: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 },
		max: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
	}]);
};
onResize();

let entries = 0;
let currentColor = randomRGB();
const bodies = new Map<string, Body>();
const constraintMap = new Map<string, { next: string, constraint: Constraint }[]>();
const parentMap = new Map<string, Set<string>>();

const addNode = (key: string, isEntry = false) => {
	const circle = Bodies.circle(isEntry ? 200 * entries++ : Math.random() * 100 - 50, isEntry ? 0 : Math.random() * 100 - 50, 10, { isStatic: isEntry, render: {
		fillStyle: isEntry ? "#fff" : currentColor,
		lineWidth: 0,
		visible: true,
		opacity: 1
	}});
	// @ts-ignore: extra info
	circle.conversation = key;
	bodies.set(key, circle);
	Composite.add(engine.world, circle);
};

const linkNode = (from: string, to: string, create = false) => {
	let circle = bodies.get(to);
	if (!circle) {
		if (!create) return;
		if (constraintMap.get(from)?.length || 0) currentColor = randomRGB();
		else currentColor = bodies.get(from)!.render.fillStyle!;
		addNode(to);
		circle = bodies.get(to)!;
	}

	const constraint = Constraint.create({
		bodyA: bodies.get(from),
		bodyB: circle,
		stiffness: 0.01,
		length: 40,
		render: {
			strokeStyle: "#ffffff7f",
			anchors: false,
			type: "line"	
		}
	});
	constraintMap.set(from, (constraintMap.get(from) || []).concat([{ next: to, constraint }]));
	bodies.set(to, circle);
	Composite.add(engine.world, constraint);
	const set = (parentMap.get(to) || new Set());
	set.add(from);
	parentMap.set(to, set);
};

const unlinkNode = (from: string, to: string) => {
	const list = constraintMap.get(from);
	if (!list) return false;
	const index = list.findIndex(({ next }) => next == to);
	if (index === undefined || index < 0) return false;
	Composite.remove(engine.world, list[index].constraint);
	list.splice(index, 1);
	if (list.length) constraintMap.set(from, list);
	else constraintMap.delete(from);
	const set = parentMap.get(to);
	set?.delete(from);
	if (!set?.size) {
		if (bodies.has(to)) Composite.remove(engine.world, bodies.get(to)!);
		bodies.delete(to);
		parentMap.delete(to);
		return true;
	}
	return false;
};

export function App() {
	const cell = useRef<HTMLDivElement>(null);
  const [id, setId] = useState(window.location.hash.slice(1));
  const [data, setData] = useState<Summatia | undefined>();

	const save = () => {
		if (!data) return;
		window.localStorage.setItem("summatia-editor", JSON.stringify(data.toData()));
		alert("Saved to local storage");
	};

	const download = () => {
		if (!data) return;
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data.toData())));
		element.setAttribute('download', "summatia.json");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		window.localStorage.setItem("summatiaData", JSON.stringify(data.toData()));
	};

  useEffect(() => {
		const localData = window.localStorage.getItem("summatia-editor");
		if (localData) {
			const summatia = new Summatia(JSON.parse(localData));
			setData(summatia);
		} else {
			fetch("/data/summatia.json").then(res => res.json()).then(json => {
				const summatia = new Summatia(json);
				setData(summatia);
			});
		}
		
		const onPopState = (ev: PopStateEvent) => {
			setId(ev.state.id || "");
		};

		const onKeyDown = (ev: KeyboardEvent) => {
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

		const onMouseDown = (ev: MouseEvent) => {
			// Scroll wheel button
			if (ev.button != 1) return;
			let lastPos = { x: ev.clientX, y: ev.clientY };
			const onMouseMove = (ev: MouseEvent) => {
				render.bounds.min.x -= ev.clientX - lastPos.x;
				render.bounds.max.x -= ev.clientX - lastPos.x;
				render.bounds.min.y -= ev.clientY - lastPos.y;
				render.bounds.max.y -= ev.clientY - lastPos.y;
				Render.lookAt(render, [render.bounds]);
				lastPos = { x: ev.clientX, y: ev.clientY };
			};
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", () => {
				window.removeEventListener("mousemove", onMouseMove);
			}, { once: true });
		};

		window.addEventListener("popstate", onPopState);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("mousedown", onMouseDown);
		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("popstate", onPopState);
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("mousedown", onMouseDown);
			window.removeEventListener("resize", onResize);
		}
  }, []);

  if (!data) return <></>;

	useEffect(() => {

		const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
	
		// recursive DFS
		const processKey = async (key: string, parent?: string) => {
			const conversation = data.conversation.get(key);
			if (!conversation) return;

			if (bodies.has(key)) {
				if (parent) linkNode(parent, key);
				return;
			}

			addNode(key, !parent);
			if (parent) linkNode(parent, key);

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

		(async () => {
			for (const entry of data.entryPoints) {
				currentColor = randomRGB();
				await processKey(entry);
			}

			engine.world.bodies = engine.world.bodies.sort((a, b) => b.collisionFilter.category! - a.collisionFilter.category!);

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
				setId(key);
			});
		})();

	}, []);

  return <>
		{id && <Preview data={data} entry={id} next={next => {
			setId(next);
		}} scroll={() => cell.current?.scrollIntoView()} renameEntry={name => {
			data.conversation.set(name, data.conversation.get(id)!);
			setId(name);
		}} save={save} download={download} linkNode={linkNode} unlinkNode={unlinkNode} />}
	</>;
}
