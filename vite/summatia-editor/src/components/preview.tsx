import { useEffect, useState } from "preact/hooks";
import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear, SummatiaResponse } from "../types/summatia";
import Restaurant from "./restaurant";
import TogglableInput from "./toggle-input";

export default function Preview(props: { data: Summatia, entry: string, renameEntry: (name: string) => void, next: (next: string) => void, scroll: () => void }) {
	const [large, setLarge] = useState(false);
	const [entry, setEntry] = useState(props.entry);
	const [conv, setConv] = useState(props.data.conversation.get(props.entry)!);
	const [emotion, setEmotion] = useState(conv.emotion.num());
	const [message, setMessage] = useState(conv.message);
	const [next, setNext] = useState((conv as any).next as (string | undefined));
	const [responses, setResponses] = useState((conv as any).responses as (SummatiaResponse[] | undefined));

	useEffect(() => {
		setEntry(props.entry);
		const conv = props.data.conversation.get(props.entry)!;
		setConv(conv);
		setEmotion(conv.emotion.num());
		setMessage(conv.message);
		setNext((conv as any).next as (string | undefined));
		setResponses((conv as any).responses as (SummatiaResponse[] | undefined));
	}, [props.entry]);

	const changeEmotion = (bit: number) => {
		conv.emotion.set(bit, !conv.emotion.get(bit));
		setEmotion(conv.emotion.num());
	};

	const changeMessage = (message: string) => {
		conv.message = message;
		setMessage(message);
	};

	const changeNext = (next: string) => {
		(conv as SummatiaConversationLinear).next = next;
		setNext(next);
	};

	const changeResponse = (message: string, next: string, index: number) => {
		const conve = conv as SummatiaConversationBranch;
		conve.responses[index].message = message;
		conve.responses[index].next = next;
		setResponses(Array.from(conve.responses));
	};

	return <div className="preview" style={large ? { maxHeight: "40vh" } : {}}>
		<Restaurant emotion={emotion} toggleLarge={() => setLarge(!large)} onToggleCheck={changeEmotion}>
			<div className="preview-text">
				<TogglableInput className="preview-key" value={entry} onCommit={props.renameEntry} onClick={() => props.scroll()} />
				<TogglableInput value={message} onCommit={changeMessage} />
				<hr />
				{next && <TogglableInput
					className="preview-next"
					onClick={() => props.next((conv as SummatiaConversationLinear).next)}
					value={next}
					onCommit={changeNext}
				/>}
				{responses && responses.map((res, ii) => {
					return <>
						<TogglableInput value={res.message} onCommit={(val) => changeResponse(val, res.next, ii)} />
						<TogglableInput
							className="preview-next"
							onClick={() => props.next(res.next)}
							value={res.next}
							onCommit={(val) => changeResponse(res.message, val, ii)}
						/>
					</>
				})}
			</div>
		</Restaurant>
		
	</div>;
}