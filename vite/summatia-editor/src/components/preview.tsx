import { useEffect, useState } from "preact/hooks";
import { Summatia, SummatiaConversationBranch, SummatiaConversationEither, SummatiaConversationLinear, SummatiaResponse } from "../types/summatia";
import Restaurant from "./restaurant";
import TogglableInput from "./toggle-input";

export default function Preview(props: { data: Summatia, entry: string, renameEntry: (name: string) => void, next: (next: string) => void, scroll: () => void }) {
	const [large, setLarge] = useState(false);
	const [entry, setEntry] = useState(props.entry);
	const [conv, setConv] = useState<SummatiaConversationEither<true>>(props.data.conversation.get(props.entry)!);
	const [emotion, setEmotion] = useState(conv.emotion.num());
	const [message, setMessage] = useState(conv.message);
	const [next, setNext] = useState((conv as any).next as (string | undefined));
	const [responses, setResponses] = useState((conv as any).responses as (SummatiaResponse[] | undefined));

	useEffect(() => {
		// save entry if not exist
		if (!props.data.conversation.has(entry) && message) {
			props.data.conversation.set(entry, conv);
		}
		setEntry(props.entry);
		// create entry based on previous if not exist
		let newConv = props.data.conversation.get(props.entry) || { message: "", emotion: conv.emotion };
		setConv(newConv);
		setEmotion(newConv.emotion.num());
		setMessage(newConv.message);
		setNext((newConv as any).next as (string | undefined));
		setResponses((newConv as any).responses as (SummatiaResponse[] | undefined));
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
		console.log(conve.responses[index]);
		setResponses(Array.from(conve.responses));
	};

	const toLinear = () => {
		const conve = conv as SummatiaConversationLinear & Partial<SummatiaConversationBranch>;
		delete conve.responses;
		const split = entry.split(/-/g);
		if (isNaN(Number(split[split.length - 1]))) split.push("1");
		else split[split.length - 1] = (Number(split[split.length - 1]) + 1).toString();
		conve.next = split.join("-");
		setNext(conve.next);
		setResponses(undefined);
	};

	const toBranch = () => {
		const conve = conv as SummatiaConversationBranch & Partial<SummatiaConversationLinear>;
		delete conve.next;
		conve.responses = [];
		setNext(conve.next);
		setResponses(conve.responses);
	};

	const addBranch = () => {
		const conve = conv as SummatiaConversationBranch;
		conve.responses.push({ message: "Message", next: "Next" });
		setResponses(Array.from(conve.responses));
	};

	const deleteBranch = (index: number) => {
		if (confirm("Are you sure?")) {
			const conve = conv as SummatiaConversationBranch;
			conve.responses.splice(index, 1);
			setResponses(Array.from(conve.responses));
		}
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
						<div className="preview-button delete" onClick={() => deleteBranch(ii)}>Delete</div>
					</>
				})}
				{!next && !responses && <div>
					Select linear or branch
				</div>}
			</div>
			<div className="preview-modify">
				{!next && <div className="preview-button linear" onClick={toLinear}>
					Use Linear
				</div>}
				{!responses && <div className="preview-button branch" onClick={toBranch}>
					Use Branch
				</div>}
				{responses && <div className="preview-button response" onClick={addBranch}>
					Add Response
				</div>}
			</div>
		</Restaurant>
		
	</div>;
}