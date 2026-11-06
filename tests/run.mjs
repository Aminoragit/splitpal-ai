// SplitPal AI test runner — plain Node, no extra dependencies.
// Compiles the pure TS logic modules to a temp dir with the project's
// TypeScript, then exercises parser + split engine invariants.
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert";

const out = mkdtempSync(join(tmpdir(), "splitpal-test-"));
execSync(
  `npx tsc lib/parser.ts lib/split.ts lib/explain.ts --outDir ${out} --module es2022 --target es2022 --moduleResolution bundler --skipLibCheck`,
  { stdio: "inherit" },
);
const { parseReceiptText } = await import(join(out, "parser.js"));
const { computeSplit } = await import(join(out, "split.js"));
const { explainShare } = await import(join(out, "explain.js"));

// --- parser ---
const items = parseReceiptText(
  "Margherita Pizza 18000\n2 x Draft Beer 4500\nCaesar Salad: 7,000\nTotal 999999",
);
assert.equal(items.length, 3, "parser finds 3 items");
assert.equal(items[0].lineTotal, 18000);
assert.equal(items[1].qty, 2);
assert.equal(items[1].lineTotal, 9000, "qty prefix: trailing price is unit price");
assert.equal(items[2].lineTotal, 7000);
console.log("parser: ok");

// --- equal split, shares sum exactly to grand total (incl. odd rounding) ---
const people = ["Minji", "Junho", "Sara"];
const split = computeSplit(
  people,
  [
    { name: "Pizza", lineTotal: 18000, assignee: "SHARED" },
    { name: "Salad", lineTotal: 7000, assignee: "Minji" },
    { name: "Beer", lineTotal: 9000, assignee: "Junho" },
  ],
  1001, // tax chosen to force rounding remainders
  777,
);
const sum = split.shares.reduce((a, s) => a + s.total, 0);
assert.equal(sum, split.grandTotal, "shares sum exactly to grand total");
assert.equal(split.grandTotal, 18000 + 7000 + 9000 + 1001 + 777);
const minji = split.shares.find((s) => s.person === "Minji");
const sara = split.shares.find((s) => s.person === "Sara");
assert.ok(minji.total > sara.total, "assigned items raise that person's share");
assert.ok(explainShare(minji).includes(minji.total.toLocaleString("en-US")), "explanation quotes engine total verbatim");
console.log("split engine: ok (sum invariant + proportional allocation + explanation)");

console.log("ALL TESTS PASSED");
