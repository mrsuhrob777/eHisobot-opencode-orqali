import * as fs from "fs";
const content = fs.readFileSync("src/app/teacher/annual-report/page.tsx", "utf8");
const lines = content.split("\n");
let depth = 0;
let inStr = null;
let inTmpl = false;
let esc = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let lineDepth = depth;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (esc) { esc = false; continue; }
    if (ch === "\\" && (inStr || inTmpl)) { esc = true; continue; }
    if (inStr) { if (ch === inStr) inStr = null; continue; }
    if (inTmpl) { if (ch === "`") inTmpl = false; continue; }
    if (ch === '"' || ch === "'") { inStr = ch; continue; }
    if (ch === "`") { inTmpl = true; continue; }
    if (ch === "{") depth++;
    if (ch === "}") depth--;
  }
  if (depth !== lineDepth) {
    console.log(`Line ${i + 1}: depth ${lineDepth} -> ${depth}`);
  }
}
console.log(`Final depth: ${depth}`);
