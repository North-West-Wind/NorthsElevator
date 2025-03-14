import { useEffect, useState } from 'preact/hooks'
import './app.css'
import SummatiaCanvas from './components/canvas';
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from './types/summatia';
import { Bitfield } from './types/bitfield';
import { JSX } from 'preact/jsx-runtime';
import { randomDarkHSV } from './helpers/color';

export function App() {
  const [id, setId] = useState("");
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

	const children: JSX.Element[] = [];

	const drawn = new Set<string>();
	const layerMap = new Map<string, number>();
	const levelMap = new Map<string, number>();
	const colorMap = new Map<string, [string, string]>();
	for (const entry of data.entryPoints) {
		const levels: ({ key: string, looped: boolean, color: [string, string] } | undefined)[][] = [];
		layerMap.set(entry, 0);
		levelMap.set(entry, 0);
		const color = randomDarkHSV();
		colorMap.set(entry, [color, color]);
		const stack = [entry];
		let key: string | undefined;
		while (key = stack.pop()) {
			if (drawn.has(key)) continue;
			const layer = layerMap.get(key)!;
			const level = levelMap.get(key)!;
			const color = colorMap.get(key)!;
			const conversation = data.conversation.get(key);

			if (!levels[level]) levels[level] = [];
			while (levels[level].length < layer)
				levels[level].push(undefined);
			//if (levels[level].length < layer) levels[level].push(...Array(levels[level].length - layer).fill(undefined));
			if (drawn.has(key)) {
				levels[level][layer] = { key, looped: true, color };
				continue;
			}
			levels[level][layer] = { key, looped: false, color };

			drawn.add(key);

			if ((conversation as any).next) {
				const lin = conversation as SummatiaConversationLinear;
				layerMap.set(lin.next, layer);
				levelMap.set(lin.next, level + 1);
				colorMap.set(lin.next, [color[1], color[1]]);
				stack.push(lin.next);
			} else if ((conversation as any).responses) {
				const bra = conversation as SummatiaConversationBranch;
				for (let ii = bra.responses.length - 1; ii >= 0; ii--) {
					const res = bra.responses[ii];
					layerMap.set(res.next, layer + ii);
					levelMap.set(res.next, level + 1);
					colorMap.set(res.next, [color[1], randomDarkHSV()]);
					stack.push(res.next);
				}
			}
		}

		// create elements from levels
		const levelsHTML = levels.map((level, ii) => {
			const cells = level.map(node => {
				if (node) return <div className={"conversation-cell" + (node.looped ? " exist" : "")} key={node.key} style={{ background: `linear-gradient(to right, ${node.color[0]}, ${node.color[1]})` }}>{node.key}</div>;
				else return <div className="conversation-cell" key={node} dangerouslySetInnerHTML={{ __html: "&nbsp;" }}></div>;
			});
			return <div className="conversation-level" key={ii}>{cells}</div>;
		});
		children.push(<div className="conversation-layer">{levelsHTML}</div>);
	}

  if (!id) return <>{children}</>;

  return <></>;
}
