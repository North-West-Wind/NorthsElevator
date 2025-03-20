import * as fs from "fs";
import * as path from "path";

const summatiaData = JSON.parse(fs.readFileSync(path.join(__dirname, "../summatia.json"), { encoding: "utf8" }));

for (const key in summatiaData) {
	if (key == "emotions") continue;
	const data = summatiaData[key];
	if (typeof data.emotion == "string") continue;
	let desc: string[] = [];
	// eyes are either open, closed, normal, half
	const eyes = [1, 2, 4, 8].map(x => !!(data.emotion & x)).filter(x => x).length;
	if (eyes > 1) desc.push("more than 1 eyes");
	else if (eyes == 0) desc.push("no eyes");
	// mouth are either open, close, happy, sad
	const mouths = [16, 32, 64, 128].map(x => !!(data.emotion & x)).filter(x => x).length;
	if (mouths > 1) desc.push("more than 1 mouths");
	else if (mouths == 0) desc.push("no mouths");
	// brows are optional, angry, worried
	const brows = [512, 1024].map(x => !!(data.emotion & x)).filter(x => x).length;
	if (brows > 1) desc.push("more than 1 brows");
	// hands are optional, on table, around face, below head
	const hands = [4096, 8192, 16384].map(x => !!(data.emotion & x)).filter(x => x).length;
	if (hands > 1) desc.push("more than 1 hands");
	// eye direction are optional, down, left, right
	const dir = [1<<15, 1<<17, 1<<18].map(x => !!(data.emotion & x)).filter(x => x).length;
	if (dir > 1) desc.push("more than 1 directions");

	if (desc.length) console.log(`${key} has ${desc.join(", ")}`);
}