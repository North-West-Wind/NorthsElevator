import { useEffect, useRef, useState } from 'preact/hooks'
import './app.css'
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from './types/summatia';
import { Bitfield } from './types/bitfield';
import { JSX } from 'preact/jsx-runtime';
import { randomDarkHSV } from './helpers/color';
import Preview from './components/preview';

export function App() {
	const cell = useRef<HTMLDivElement>(null);
  const [id, setId] = useState("");
	const [clicked, setClicked] = useState("");
  const [data, setData] = useState<Summatia | undefined>();

  useEffect(() => {
    fetch("/data/summatia.json").then(res => res.json()).then(json => {
      const summatia: Summatia = {
        emotionPreset: new Map(),
        conversation: new Map(),
        entryPoints: []
      };

      for (const key in json.emotions) {
        if (key == "reference") continue;
        summatia.emotionPreset.set(key, json.emotions[key]);
      }

      const ids = new Set<string>();
      const hasParent = new Set<string>();

      for (const key in json) {
        if (key == "emotions") continue;
        ids.add(key);
        const conversation = json[key];
				if (typeof conversation.emotion == "string") conversation.emotion = summatia.emotionPreset.get(conversation.emotion);
        conversation.emotion = new Bitfield(conversation.emotion);
        summatia.conversation.set(key, conversation);
        if (conversation.next) hasParent.add(conversation.next);
        else if (conversation.responses)
          for (const { next } of conversation.responses)
            hasParent.add(next);
      }

      hasParent.forEach(key => ids.delete(key));
      summatia.entryPoints = Array.from(ids);

      setData(summatia);
    });
  }, []);

  if (!data) return <></>;

	const [collapsed, setCollapsed] = useState(new Set<string>());
	const [children, setChildren] = useState<JSX.Element[]>([]);
	const [cacheColorMap, setCacheColorMap] = useState(new Map<string, [string, string]>());

	useEffect(() => {
		const ch = [];

		const drawn = new Set<string>();
		const layerMap = new Map<string, number>();
		const levelMap = new Map<string, number>();
		const colorMap = new Map<string, [string, string]>();
		const cacheMap = new Map(cacheColorMap);
	
		let levels: ({ key: string, looped: boolean, color: [string, string] } | undefined)[][];
	
		// recursive DFS
		const processKey: (key: string, parent?: string) => number = (key: string, parent?: string) => {
			const colorKey = key + (parent ? "|" + parent : "");
			const layer = layerMap.get(key)!;
			const level = levelMap.get(key)!;
			const directlyUseColor = cacheColorMap.has(colorKey);
			const color = cacheColorMap.get(colorKey) || colorMap.get(colorKey)!;
			const conversation = data.conversation.get(key);

			if (!directlyUseColor) cacheMap.set(colorKey, color);
	
			if (!levels[level]) levels[level] = [];
			while (levels[level].length < layer)
				levels[level].push(undefined);
			//if (levels[level].length < layer) levels[level].push(...Array(levels[level].length - layer).fill(undefined));
			if (drawn.has(key)) {
				levels[level][layer] = { key, looped: true, color };
				return 1;
			}
			levels[level][layer] = { key, looped: false, color };
			if (collapsed.has(key)) return 1;
	
			drawn.add(key);
	
			if ((conversation as any).next) {
				const lin = conversation as SummatiaConversationLinear;
				layerMap.set(lin.next, layer);
				levelMap.set(lin.next, level + 1);
				colorMap.set(`${lin.next}|${key}`, [color[1], color[1]]);
				return processKey(lin.next, key);
			} else if ((conversation as any).responses) {
				const bra = conversation as SummatiaConversationBranch;
				let span = 0;
				for (let ii = 0; ii < bra.responses.length; ii++) {
					const res = bra.responses[ii];
					layerMap.set(res.next, layer + span);
					levelMap.set(res.next, level + 1);
					colorMap.set(`${res.next}|${key}`, directlyUseColor ? color : [color[1], randomDarkHSV()]);
					span += processKey(res.next, key);
				}
				return span;
			}
			return 1;
		};
	
		for (const entry of data.entryPoints) {
			levels = [];
			layerMap.set(entry, 0);
			levelMap.set(entry, 0);
			const color = randomDarkHSV();
			colorMap.set(entry, [color, color]);
			processKey(entry);
	
			// create elements from levels
			const levelsHTML = levels.map((level, ii) => {
				const cells = level.map((node, jj) => {
					if (node) return <div
							className={"conversation-cell real" + (node.looped ? " exist" : "") + (node.key == clicked ? " selected" : "")}
							key={node.key + jj}
							style={node.key == clicked ? { background: "#fff", color: "#000" } : { background: `linear-gradient(to right, ${node.color[0]}, ${node.color[1]})` }}
							onClick={ev => {
								if (ev.button == 0) {
									if (clicked == node.key) setClicked("");
									else {
										setClicked(node.key);
										setId(node.key);
									}
								}
							}}
							onMouseEnter={() => {
								if (!clicked)
									setId(node.key);
							}}
							onContextMenu={ev => {
								ev.preventDefault();
								const set = new Set(collapsed);
								if (set.has(node.key)) set.delete(node.key);
								else set.add(node.key);
								setCollapsed(set);
							}}
							ref={node.key == clicked ? cell : undefined}
						>{collapsed.has(node.key) ? (node.key.slice(0, 8) + "...") : node.key}</div>;
					else return <div className="conversation-cell" key={jj} dangerouslySetInnerHTML={{ __html: "&nbsp;" }}></div>;
				});
				return <div className="conversation-level" key={ii}>{cells}</div>;
			});
			ch.push(<div className="conversation-layer">{levelsHTML}</div>);
		}
		setChildren(ch);
		setCacheColorMap(cacheMap);
	}, [collapsed, clicked]);

  return <>
		{children}
		{id && <Preview data={data} entry={id} next={next => {
			setClicked(next);
			setId(next);
		}} scroll={() => cell.current?.scrollIntoView()} />}
	</>;
}
