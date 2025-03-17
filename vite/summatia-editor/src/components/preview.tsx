import { Summatia, SummatiaConversationBranch, SummatiaConversationLinear } from "../types/summatia";
import Restaurant from "./restaurant";

export default function Preview(props: { data: Summatia, entry: string, next: (next: string) => void, scroll: () => void }) {
	const conv = props.data.conversation.get(props.entry)!;

	return <div className="preview">
		<Restaurant emotion={conv.emotion.num()} />
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
	</div>;
}