import { NextResponse } from "next/server";
import { parseReceiptText } from "@/lib/parser";

export async function POST(req: Request) {
  const { text } = (await req.json()) as { text?: string };
  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Receipt text is empty." }, { status: 400 });
  }
  const items = parseReceiptText(text);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "No priced line items found. Use one item per line, price at the end." },
      { status: 422 },
    );
  }
  return NextResponse.json({ items });
}
