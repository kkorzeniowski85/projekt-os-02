// Znaczniki amerykańskiego akcentu w rozpoznanych głoskach (wynik akcent.py).
import { readFileSync, writeFileSync } from "node:fs";

const rows = JSON.parse(readFileSync(process.argv[2], "utf8")).filter((r) => r.heard !== undefined);
const BATH = new Set(["bath", "path", "glass", "grass", "class", "dance", "after", "can't", "plant", "half", "laugh", "banana", "castle", "fast", "last", "past", "ask", "basket", "branch", "giraffe", "aunt", "calf", "rather", "drama", "answer", "example", "chance", "staff", "raft", "vase", "nasty", "master", "grasshopper", "bathroom", "glasses", "classroom", "afternoon", "dancing", "pasta", "plaster", "craft", "draught", "father", "tomato", "banana"]);
const LOT = /^(dog|hot|box|shop|clock|sock|frog|top|pot|stop|spot|lot|not|got|cot|dot|fox|rock|block|lock|knock|jog|log|fog|hop|mop|pop|chop|drop|crop|cross|boss|lost|cost|soft|off|long|song|strong|wrong|doctor|bottle|lolly|holiday|body|chocolate|on|want|wash|watch|what|was|orange|sorry|tomorrow|copy|coffee|olive|october|monkey)$/;
const TFLAP = /^(water|butter|letter|little|better|sitting|computer|matter|bottle|kitten|mitten|potato|tomato|city|pretty|forty|thirty|twenty|party|bitter|batter|getting|hitting|putting|sitting|waiter|daughter|eating|meeting|writing|biting)$/;

const flags = [];
for (const r of rows) {
  const h = r.heard.split(" ");
  const why = [];
  const w = r.text.toLowerCase();
  if (w === "zebra" && /^z (i|iː)/.test(r.heard)) why.push("zebra jak „ZEE-bra”");
  if (w === "tomato" && h.includes("eɪ")) why.push("tomato jak „to-MAY-to”");
  if (BATH.has(w) && h.includes("æ") && !h.some((p) => p === "ɑː" || p === "ɑ" || p === "a")) why.push("„a” amerykańskie (æ)");
  if (TFLAP.test(w) && h.some((p) => p === "ɾ")) why.push("„t” amerykańskie (miękkie)");
  const gbR = r.gb.split(" ").filter((p) => p === "ɹ").length;
  const usR = r.us.split(" ").filter((p) => p === "ɹ" || p === "ɚ" || p === "ɝ").length;
  // Bez „ɚ” — model pisze je także przy brytyjskiej końcówce „-er” (kalibracja).
  const heardR = h.filter((p) => p === "ɹ" || p === "ɝ" || p === "ɔːɹ" || p === "ɑːɹ").length;
  if (usR > gbR && heardR > gbR) why.push("słychać „r” po samogłosce");
  if (why.length) flags.push({ id: r.id, text: r.text, heard: r.heard, gb: r.gb, why: why.join("; ") });
}
const by = {};
for (const r of rows) {
  const g = r.id.split("/")[0];
  by[g] ??= { n: 0, flagged: 0 };
  by[g].n += 1;
}
for (const f of flags) by[f.id.split("/")[0]].flagged += 1;
console.log(JSON.stringify(by));
writeFileSync(process.argv[3], JSON.stringify(flags, null, 1));
for (const f of flags.filter((f) => !f.id.startsWith("us/")).slice(0, 80)) console.log(`${f.id.padEnd(22)} ${f.why}  | słyszy: ${f.heard} | GB: ${f.gb}`);
