import { useEffect, useState } from 'preact/hooks'
import './app.css'
import SummatiaCanvas from './components/canvas';
import { Summatia } from './types/summatia';
import { Bitfield } from './types/bitfield';

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

  if (!id) return <SummatiaCanvas data={data} />

  return <></>;
}
