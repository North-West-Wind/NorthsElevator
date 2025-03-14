import { Bitfield } from "./bitfield";

export type Summatia = {
	emotionPreset: Map<string, number>;
	conversation: Map<string, SummatiaConversationLinear | SummatiaConversationBranch>;
	entryPoints: string[];
}

type SummatiaConversation = {
	message: string;
	emotion: Bitfield | string;
}

export type SummatiaConversationLinear = SummatiaConversation & { next: string };
export type SummatiaConversationBranch = SummatiaConversation & { responses: SummatiaResponse[] };

export type SummatiaResponse = {
	message: string;
	next: string;
}

