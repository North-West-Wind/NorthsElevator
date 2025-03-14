import { useEffect, useRef, useState } from "preact/hooks";
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from "../types/summatia";
import { JSX } from "preact/jsx-runtime";

export default function SummatiaCanvas(props: { data: Summatia }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const [changed, setChanged] = useState(true);

	useEffect(() => {
		const onResize = () => {
			const canvas = ref.current;
			if (canvas) {
				canvas.width = window.innerWidth;
				canvas.height = window.innerHeight;
			}
		};

		onResize();
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	useEffect(() => {
		const draw = () => {
			const ctx = ref.current?.getContext("2d");
			if (!ctx) return;

			if (!changed) {
				requestAnimationFrame(draw);
				return;
			}

			ctx.fillStyle = "#232323";
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			const fontSize = ctx.canvas.width / 75;
			ctx.font = `${fontSize}px Arial`;
			const drawn = new Set<string>();
			const layerMap = new Map<string, number>();
			const levelMap = new Map<string, number>();
			let entryLayer = 0;
			for (const entry of props.data.entryPoints) {
				layerMap.set(entry, entryLayer);
				levelMap.set(entry, 0);
				const queue = [entry];
				let key: string | undefined;
				while (key = queue.shift()) {
					if (drawn.has(key)) continue;
					const layer = layerMap.get(key)!;
					const level = levelMap.get(key)!;
					const conversation = props.data.conversation.get(key);

					const metrics = ctx.measureText(key);
					ctx.fillStyle = "#fff";
					ctx.fillRect(level * 100 + 20, layer * 50 + 20, metrics.width + fontSize * 2, fontSize * 2);
					ctx.textAlign = "left";
					ctx.textBaseline = "middle";
					ctx.fillStyle = "#000";
					ctx.fillText(key, level * 100 + 20 + fontSize, layer * 50 + 20 + fontSize);

					drawn.add(key);

					if ((conversation as any).next) {
						const lin = conversation as SummatiaConversationLinear;
						layerMap.set(lin.next, layer);
						levelMap.set(lin.next, level + 1);
						queue.push(lin.next);
					} else {
						const bra = conversation as SummatiaConversationBranch;
						for (let ii = 0; ii < bra.responses.length; ii++) {
							const res = bra.responses[ii];
							entryLayer = Math.max(entryLayer, layer + ii);
							layerMap.set(res.next, layer + ii);
							levelMap.set(res.next, level + 1);
							queue.push(res.next);
						}
					}
				}
			}

			setChanged(false);

			requestAnimationFrame(draw);
		};

		draw();
	}, []);

	return <canvas ref={ref} />
}