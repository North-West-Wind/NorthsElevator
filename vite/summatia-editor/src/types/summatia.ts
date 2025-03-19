import { Bitfield } from "./bitfield";
import { DoubleMap } from "./map";

type SummatiaConversation = {
	message: string;
	emotion: Bitfield;
}

type SummatiaDataConversation = {
	message: string;
	emotion: number | string;
}

export type SummatiaConversationLinear<Converted = true | false> = (Converted extends true ? SummatiaConversation : SummatiaDataConversation) & { next: string };
export type SummatiaConversationBranch<Converted = true | false> = (Converted extends true ? SummatiaConversation : SummatiaDataConversation) & { responses: SummatiaResponse[] };
export type SummatiaConversationEither<Converted = true | false> = SummatiaConversationLinear<Converted> | SummatiaConversationBranch<Converted>;

export type SummatiaResponse = {
	message: string;
	next: string;
}

export type SummatiaData =
	Record<"emotions", Record<"reference", Record<string, string>> & Record<string, number>> &
	Record<string, SummatiaConversationEither<false>>

export class Summatia {
	emotionPreset: DoubleMap<string, number>;
	conversation: Map<string, SummatiaConversationEither<true>>;
	entryPoints: string[];
	private emotionRef: Record<string, string> = {};

	constructor(data: SummatiaData) {
		this.emotionPreset = new DoubleMap();
		this.conversation = new Map();

		for (const key in data.emotions) {
			if (key == "reference") this.emotionRef = data.emotions[key];
			else this.emotionPreset.set(key, data.emotions[key]);
		}

		const ids = new Set<string>();
		const hasParent = new Set<string>();

		for (const key in data) {
			if (key == "emotions") continue;
			ids.add(key);
			const conversation = data[key] as (SummatiaConversation | SummatiaDataConversation);
			if (typeof conversation.emotion == "string") conversation.emotion = this.emotionPreset.getA(conversation.emotion)!;
			conversation.emotion = new Bitfield(conversation.emotion as number);
			this.conversation.set(key, conversation as SummatiaConversationEither<true>);
			if ((conversation as any).next) hasParent.add((conversation as SummatiaConversationLinear).next);
			else if ((conversation as any).responses)
				for (const { next } of (conversation as SummatiaConversationBranch).responses)
					hasParent.add(next);
		}

		hasParent.forEach(key => ids.delete(key));
		this.entryPoints = Array.from(ids);
	}

	toData() {
		let data: Partial<SummatiaData> = {};
		(data as any).emotions = {
			reference: this.emotionRef
		};
		for (const [emotion, num] of this.emotionPreset.entries()) {
			data.emotions![emotion] = num;
		}
		for (const [key, conversation] of this.conversation.entries()) {
			let unconverted = conversation as SummatiaConversationEither;
			unconverted.emotion = conversation.emotion.num();
			if (this.emotionPreset.hasB(unconverted.emotion)) unconverted.emotion = this.emotionPreset.getB(unconverted.emotion)!;
			data[key] = unconverted as SummatiaConversationEither<false>;
		}
		return data as SummatiaData;
	}
}

