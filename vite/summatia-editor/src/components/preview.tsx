import { useEffect, useRef, useState } from "preact/hooks";
import { Summatia, SummatiaConversationBranch, SummatiaConversationEither, SummatiaConversationLinear, SummatiaResponse } from "../types/summatia";
import Restaurant from "./restaurant";
import TogglableInput from "./toggle-input";

type Props = {
	data: Summatia;
	entry: string;
	renameEntry: (name: string) => void;
	next: (next: string) => void;
	scroll: () => void;
	save: () => void;
	download: () => void;
	linkNode: (from: string, to: string, create?: boolean) => void;
	unlinkNode: (from: string, to: string) => boolean;
};

export default function Preview(props: Props) {
	const convRef = useRef<SummatiaConversationEither<true>>(props.data.conversation.get(props.entry)!);
	const [emotion, setEmotion] = useState(convRef.current.emotion.num());
	const [message, setMessage] = useState(convRef.current.message);
	const [next, setNext] = useState((convRef.current as any).next as (string | undefined));
	const [responses, setResponses] = useState((convRef.current as any).responses as (SummatiaResponse[] | undefined));

	const recursiveUnlinkNode = (from: string, to: string) => {
		if (!props.unlinkNode(from, to)) return;
		const conv = props.data.conversation.get(to);
		if (!conv) return;
		if ((conv as any).next) {
			recursiveUnlinkNode(to, (conv as SummatiaConversationLinear).next);
		} else if ((conv as any).responses) {
			(conv as SummatiaConversationBranch).responses.forEach(({ next }) => recursiveUnlinkNode(to, next));
		}
		props.data.conversation.delete(to);
	};

	useEffect(() => {
		convRef.current = props.data.conversation.get(props.entry) || { message: "", emotion: convRef.current.emotion.copy() };
		setEmotion(convRef.current.emotion.num());
		setMessage(convRef.current.message);
		setNext((convRef.current as SummatiaConversationLinear).next);
		setResponses((convRef.current as SummatiaConversationBranch).responses);
		if (!props.data.conversation.has(props.entry))
			props.data.conversation.set(props.entry, convRef.current);
	}, [props.entry]);

	const changeEmotion = (bit: number) => {
		convRef.current.emotion.set(bit, !convRef.current.emotion.get(bit));
		setEmotion(convRef.current.emotion.num());
	};

	const changeMessage = (message: string) => {
		convRef.current.message = message;
		setMessage(convRef.current.message);
	}

	const changeNext = (next: string) => {
		const conv = convRef.current as SummatiaConversationLinear;
		if (next != conv.next) {
			recursiveUnlinkNode(props.entry, conv.next);
			if (next) props.linkNode(props.entry, next, true);
			conv.next = next;
			setNext(conv.next);
		}
	};

	const changeResponse = (message: string, next: string, index: number) => {
		const conv = convRef.current as SummatiaConversationBranch;
		if (next != conv.responses[index].next) {
			recursiveUnlinkNode(props.entry, conv.responses[index].next);
			if (next) props.linkNode(props.entry, next, true);
			conv.responses[index].next = next;
		}
		conv.responses[index].message = message;
		setResponses(Array.from(conv.responses));
	};

	const toLinear = () => {
		const conv = convRef.current as SummatiaConversationLinear & Partial<SummatiaConversationBranch>;
		if (conv.responses) {
			conv.responses.forEach(({ next }) => recursiveUnlinkNode(props.entry, next));
			delete conv.responses;
		}
		const split = props.entry.split(/-/g);
		if (isNaN(Number(split[split.length - 1]))) split.push("1");
		else split[split.length - 1] = (Number(split[split.length - 1]) + 1).toString();
		conv.next = split.join("-");
		props.linkNode(props.entry, conv.next, true);
		setNext(conv.next);
		setResponses(undefined);
	};

	const toBranch = () => {
		const conv = convRef.current as SummatiaConversationBranch & Partial<SummatiaConversationLinear>;
		if (conv.next) recursiveUnlinkNode(props.entry, conv.next);
		delete conv.next;
		conv.responses = [];
		setNext(undefined);
		setResponses(conv.responses);
	};

	const addBranch = () => {
		(convRef.current as SummatiaConversationBranch).responses.push({ message: "Message", next: "Next" });
		setResponses(Array.from((convRef.current as SummatiaConversationBranch).responses));
	};

	const deleteBranch = (index: number) => {
		if (confirm("Are you sure?")) {
			const conv = convRef.current as SummatiaConversationBranch;
			recursiveUnlinkNode(props.entry, conv.responses[index].next);
			conv.responses.splice(index, 1);
			setResponses(Array.from(conv.responses));
		}
	};

	const moveBranch = (index: number, up: boolean) => {
		const conv = convRef.current as SummatiaConversationBranch;
		if (up && index == 0 || !up && index == conv.responses.length - 1) return;
		const tmp = conv.responses[index];
		const swap = up ? index - 1 : index + 1;
		conv.responses[index] = conv.responses[swap];
		conv.responses[swap] = tmp;
		setResponses(Array.from(conv.responses));
	};

	return <div className="preview">
		<Restaurant emotion={emotion} onToggleCheck={changeEmotion}>
			<div className="preview-text">
				<TogglableInput className="preview-key" value={props.entry} onCommit={props.renameEntry} onClick={() => props.scroll()} />
				<TogglableInput value={message} onCommit={changeMessage} />
				<hr />
				{next && <TogglableInput
					className="preview-next"
					onClick={() => props.next(next)}
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
						<div className="preview-button-container">
							<div className={"preview-button move" + (ii == 0 ? " disabled" : "")} onClick={() => moveBranch(ii, true)}>▲</div>
							<div className={"preview-button move" + (ii == responses.length - 1 ? " disabled" : "")} onClick={() => moveBranch(ii, false)}>▼</div>
							<div className="preview-button delete" onClick={() => deleteBranch(ii)}>Delete</div>
						</div>
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
				<div className="preview-button save" onClick={props.save}>
					Save
				</div>
				<div className="preview-button save" onClick={props.download}>
					Download
				</div>
			</div>
		</Restaurant>
		
	</div>;
}