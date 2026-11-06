import { NextResponse } from "next/server";
import { computeSplit, type SplitItemInput } from "@/lib/split";
import { explainShare, reminderDraft } from "@/lib/explain";
import { setState, type ShareRecord } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    people?: string[];
    items?: SplitItemInput[];
    tax?: number;
    tip?: number;
  };
  const people = (body.people ?? []).filter((p) => p.trim());
  if (people.length < 2) {
    return NextResponse.json({ error: "Add at least two participants." }, { status: 400 });
  }
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: "No items to split." }, { status: 400 });
  }
  const split = computeSplit(people, body.items, body.tax ?? 0, body.tip ?? 0);
  const shares: ShareRecord[] = split.shares.map((s) => ({
    person: s.person,
    total: s.total,
    status: "PENDING",
    explanation: explainShare(s),
    reminder: reminderDraft(s, "[this participant's PayPal payment link]"),
  }));
  setState({ split, shares });
  return NextResponse.json({ split, shares });
}
