import { useEffect, useState } from "preact/hooks";
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from "../types/summatia";
import Restaurant from "./restaurant";

export default function Preview(props: { data: Summatia, entry: string, next: (next: string) => void, scroll: () => void }) {
	const [large, setLarge] = useState(false);
	const [conv, setConv] = useState(props.data.conversation.get(props.entry)!);
	const [emotion, setEmotion] = useState(conv.emotion.num());

	useEffect(() => {
		const conv = props.data.conversation.get(props.entry)!;
		setConv(conv);
		setEmotion(conv.emotion.num());
	}, [props.entry]);

	const changeEmotion = (bit: number) => {
		conv.emotion.set(bit, !conv.emotion.get(bit));
		setEmotion(conv.emotion.num());
	};

	return <div className="preview" style={large ? { maxHeight: "40vh" } : {}}>
		<Restaurant emotion={emotion} toggleLarge={() => setLarge(!large)} onToggleCheck={changeEmotion}>
			<div className="preview-text">
				<div className="preview-key" onClick={() => props.scroll()}>{props.entry}</div>
				<div>{conv.message}</div>
				{(conv as any).next && <div className="preview-next" onClick={() => props.next((conv as SummatiaConversationLinear).next)}>{"->"} {(conv as SummatiaConversationLinear).next}</div>}
				{(conv as any).responses && (conv as SummatiaConversationBranch).responses.map(res => {
					return <>
						<div>{res.message}</div>
						<div className="preview-next" onClick={() => props.next(res.next)}>{"->"} {res.next}</div>
					</>
				})}
			</div>
		</Restaurant>
		
	</div>;
}