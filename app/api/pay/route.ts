import { NextResponse } from "next/server";
import { createOrder, captureOrder, verifyCapture, paypalConfigured } from "@/lib/paypal";
import { getState } from "@/lib/store";

// Per-share PayPal flow:
//  1) create an Orders v2 order for exactly this share (idempotency key = person+total)
//  2) in demo mode (no Sandbox credentials) the mock approval is completed here;
//     with real Sandbox credentials this returns the approve URL and the client
//     completes approval, then calls this route again with action:"capture".
//  3) a share is marked PAID only after capture + server-side verification.
export async function POST(req: Request) {
  const { person, action } = (await req.json()) as { person?: string; action?: string };
  const state = getState();
  if (!state) return NextResponse.json({ error: "No active split." }, { status: 400 });
  const share = state.shares.find((s) => s.person === person);
  if (!share) return NextResponse.json({ error: "Share not found." }, { status: 404 });
  if (share.status === "PAID") return NextResponse.json({ share, shares: state.shares });

  const idem = `${share.person}-${share.total}`.replace(/\s+/g, "_");

  if (!share.orderId) {
    const order = await createOrder(share.total, `SplitPal AI — ${share.person}'s share`, idem);
    share.orderId = order.orderId;
    share.mock = order.mock;
    if (order.approveUrl && action !== "capture") {
      return NextResponse.json({ share, approveUrl: order.approveUrl, shares: state.shares });
    }
  }

  const capture = await captureOrder(share.orderId);
  const verified = await verifyCapture(share.orderId);
  if (capture.status === "COMPLETED" && verified) {
    share.status = "PAID";
    share.captureId = capture.captureId;
  }
  return NextResponse.json({
    share,
    shares: state.shares,
    sandboxMode: paypalConfigured() ? "sandbox" : "demo-mock",
  });
}
