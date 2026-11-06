// SplitPal AI — deterministic split engine.
//
// ALL money maths in the product happens here, in plain testable code.
// The AI/explanation layer never calculates amounts; it only narrates the
// numbers this engine produces. Shares always sum exactly to the bill total:
// tax and tip are allocated proportionally to each person's item subtotal,
// rounded to whole currency units, and the rounding remainder is assigned
// deterministically (largest subtotal first, then name order).

export interface SplitItemInput {
  name: string;
  lineTotal: number;
  /** Participant name, or "SHARED" to split across everyone. */
  assignee: string;
}

export interface PersonShare {
  person: string;
  itemSubtotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
  itemNames: string[];
}

export interface SplitResult {
  itemsTotal: number;
  tax: number;
  tip: number;
  grandTotal: number;
  shares: PersonShare[];
}

function allocateProportional(
  people: string[],
  subtotals: Map<string, number>,
  itemsTotal: number,
  amount: number,
): Map<string, number> {
  const result = new Map<string, number>(people.map((p) => [p, 0]));
  if (amount === 0 || itemsTotal === 0) return result;
  const raw = people.map((p) => ({
    person: p,
    exact: (subtotals.get(p)! / itemsTotal) * amount,
  }));
  let assigned = 0;
  for (const r of raw) {
    const whole = Math.floor(r.exact);
    result.set(r.person, whole);
    assigned += whole;
  }
  let remainder = amount - assigned;
  // Largest fractional part first; ties broken by larger subtotal, then name.
  const order = [...raw].sort((a, b) => {
    const fa = a.exact - Math.floor(a.exact);
    const fb = b.exact - Math.floor(b.exact);
    if (fb !== fa) return fb - fa;
    const sa = subtotals.get(b.person)! - subtotals.get(a.person)!;
    if (sa !== 0) return sa;
    return a.person.localeCompare(b.person);
  });
  let i = 0;
  while (remainder > 0 && order.length > 0) {
    const p = order[i % order.length].person;
    result.set(p, result.get(p)! + 1);
    remainder -= 1;
    i += 1;
  }
  return result;
}

export function computeSplit(
  people: string[],
  items: SplitItemInput[],
  tax: number,
  tip: number,
): SplitResult {
  const subtotals = new Map<string, number>(people.map((p) => [p, 0]));
  const itemNames = new Map<string, string[]>(people.map((p) => [p, []]));

  for (const item of items) {
    if (item.assignee === "SHARED") {
      const base = Math.floor(item.lineTotal / people.length);
      let rem = item.lineTotal - base * people.length;
      for (const p of people) {
        const extra = rem > 0 ? 1 : 0;
        if (rem > 0) rem -= 1;
        subtotals.set(p, subtotals.get(p)! + base + extra);
        itemNames.get(p)!.push(`${item.name} (shared)`);
      }
    } else if (subtotals.has(item.assignee)) {
      subtotals.set(item.assignee, subtotals.get(item.assignee)! + item.lineTotal);
      itemNames.get(item.assignee)!.push(item.name);
    }
  }

  const itemsTotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const taxShares = allocateProportional(people, subtotals, itemsTotal, tax);
  const tipShares = allocateProportional(people, subtotals, itemsTotal, tip);

  const shares: PersonShare[] = people.map((p) => {
    const itemSubtotal = subtotals.get(p)!;
    const taxShare = taxShares.get(p)!;
    const tipShare = tipShares.get(p)!;
    return {
      person: p,
      itemSubtotal,
      taxShare,
      tipShare,
      total: itemSubtotal + taxShare + tipShare,
      itemNames: itemNames.get(p)!,
    };
  });

  return { itemsTotal, tax, tip, grandTotal: itemsTotal + tax + tip, shares };
}
