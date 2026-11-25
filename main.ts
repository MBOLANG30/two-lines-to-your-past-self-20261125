// Two Lines to Your Past Self — make.fun entry.
// Writes exactly two lines to /output/entry.txt (or $MAKEFUN_OUTPUT_DIR/entry.txt).
// Line 1 warns the writer's past self about one specific moment, in one sentence.
// Line 2 says in one sentence why that moment mattered and what changed because of it.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINES = [
  "At 2 a.m. on a Tuesday in March 2021, in your mother's kitchen, you told her you were quitting university to trade crypto full time.",
  "That sentence cost you the scholarship, the degree, and three years chasing pumps before you went back and finished what you started.",
];

function sentenceCount(line) {
  // Count sentence-ending punctuation only where a sentence actually ends:
  // at the end of the line, or before a space and a capital letter.
  // This keeps abbreviations such as "a.m." from being counted as sentences.
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (i === line.length - 1) {
      count++;
    } else if (line[i + 1] === " " && /[A-Z]/.test(line[i + 2] ?? "")) {
      count++;
    }
  }
  return count;
}

function validate(lines) {
  if (lines.length !== 2) {
    throw new Error(`expected exactly 2 lines, got ${lines.length}`);
  }
  for (const line of lines) {
    if (line !== line.trim()) {
      throw new Error("line has leading or trailing whitespace");
    }
    if (line.length === 0) {
      throw new Error("line is empty");
    }
    if (/[\u0000-\u001f\u007f]/.test(line)) {
      throw new Error("line contains a control character");
    }
    if (sentenceCount(line) !== 1) {
      throw new Error(`line must be exactly one sentence: ${JSON.stringify(line)}`);
    }
    if (!/[.!?]$/.test(line)) {
      throw new Error("line must end with sentence punctuation");
    }
  }
  const text = lines.join("\n") + "\n";
  if (text.trim().length === 0) {
    throw new Error("entry is only whitespace");
  }
  if (text.length - 1 > 280) {
    throw new Error(`entry is ${text.length - 1} characters, over the 280 limit`);
  }
  // The gate counts the whole file, trailing newline included.
  if (text.length > 280) {
    throw new Error(`entry file is ${text.length} characters including newline, over the 280 limit`);
  }
  return text;
}

const text = validate(LINES);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, text, "utf8");

// Verify the byte round-trip: read it back and compare exactly.
const back = readFileSync(outPath, "utf8");
if (back !== text) {
  throw new Error("entry.txt round-trip mismatch");
}
const byteLength = Buffer.byteLength(back, "utf8");
if (byteLength === 0 || back.trim().length === 0) {
  throw new Error("entry.txt is empty");
}
console.log(`Wrote ${outPath} (${text.length - 1} characters, ${byteLength} bytes)`);
