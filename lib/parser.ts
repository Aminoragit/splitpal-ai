// Deterministic receipt-text parser for SplitPal AI.
//
// This module contains NO language model and NO randomness: the same input
// always produces the same items. An optional LLM extraction layer (see
// PACKAGE.md) may propose items in a future version, but anything it proposes
// must pass through the same validation and host confirmation as this parser.

export interface ParsedItem {
  name: string;
  qty: number;
  unitPrice: number; // whole currency units
  lineTotal: number; // qty * unitPrice
  confidence: "high" | "low";
}

const PRICE_AT_END = /^(.*?)[\s:]*(-?[\d][\d,]*)\s*(?:원|krw)?$/i;
const QTY_PREFIX = /^(\d+)\s*(?:x|×|개)\s+(.+)$/i;
const QTY_SUFFIX = /^(.+?)\s*(?:x|×)\s*(\d+)$/i;

function toAmount(raw: string): number {
  return parseInt(raw.replace(/,/g, ""), 10);
}

/**
 * Parse one item per line. Supported shapes:
 *   Margherita Pizza 18000
 *   2 x Draft Beer 4500        (4500 = unit price)
 *   Draft Beer x2 9000         (9000 = line total)
 *   Caesar Salad: 7,000
 * Lines without a trailing price are skipped; lines whose shape is unusual
 * are returned with confidence "low" so the host can fix them.
 */
export function parseReceiptText(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(subtotal|소계|total|합계|tax|tip|부가세|팁)/i.test(line)) continue;

    const m = line.match(PRICE_AT_END);
    if (!m) continue;
    let name = m[1].trim();
    const amount = toAmount(m[2]);
    if (!name || Number.isNaN(amount)) continue;

    let qty = 1;
    let confidence: "high" | "low" = "high";

    const pre = name.match(QTY_PREFIX);
    const suf = name.match(QTY_SUFFIX);
    if (pre) {
      qty = parseInt(pre[1], 10);
      name = pre[2].trim();
      // With a qty prefix we treat the trailing amount as the unit price.
      items.push({ name, qty, unitPrice: amount, lineTotal: qty * amount, confidence });
      continue;
    }
    if (suf) {
      name = suf[1].trim();
      qty = parseInt(suf[2], 10);
      if (qty > 0 && amount % qty === 0) {
        items.push({ name, qty, unitPrice: amount / qty, lineTotal: amount, confidence });
      } else {
        confidence = "low";
        items.push({ name, qty, unitPrice: amount, lineTotal: amount, confidence });
      }
      continue;
    }
    if (amount < 0) confidence = "low"; // discount lines etc. — host should review
    items.push({ name, qty, unitPrice: amount, lineTotal: amount, confidence });
  }
  return items;
}
