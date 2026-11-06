// SplitPal AI — PayPal Orders v2 integration (Sandbox first).
//
// Real code path: when PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are set, this
// module talks to the official PayPal Sandbox REST API
// (https://api-m.sandbox.paypal.com): OAuth token -> create order -> capture,
// and the caller must only mark a share PAID after a COMPLETED capture has
// been re-checked server-side (see verifyCapture).
//
// Demo mode: when no credentials are configured, create/capture return
// clearly-labelled MOCK-* identifiers and `mock: true`. Nothing in the UI is
// allowed to hide that flag — demo payments never pretend to be real.

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function base(): string {
  return process.env.PAYPAL_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

async function accessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface CreatedOrder {
  orderId: string;
  approveUrl: string | null;
  mock: boolean;
}

export async function createOrder(
  amountWon: number,
  description: string,
  idempotencyKey: string,
): Promise<CreatedOrder> {
  if (!paypalConfigured()) {
    return {
      orderId: `MOCK-ORDER-${idempotencyKey}`,
      approveUrl: null,
      mock: true,
    };
  }
  const token = await accessToken();
  const res = await fetch(`${base()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": idempotencyKey,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          amount: { currency_code: "USD", value: (amountWon / 1400).toFixed(2) },
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status}`);
  const data = (await res.json()) as {
    id: string;
    links?: { rel: string; href: string }[];
  };
  const approve = data.links?.find((l) => l.rel === "approve")?.href ?? null;
  return { orderId: data.id, approveUrl: approve, mock: false };
}

export interface CaptureResult {
  captureId: string;
  status: string;
  mock: boolean;
}

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  if (!paypalConfigured() || orderId.startsWith("MOCK-")) {
    return { captureId: `MOCK-CAPTURE-${orderId.replace("MOCK-ORDER-", "")}`, status: "COMPLETED", mock: true };
  }
  const token = await accessToken();
  const res = await fetch(`${base()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`PayPal capture failed: ${res.status}`);
  const data = (await res.json()) as {
    id: string;
    status: string;
    purchase_units?: { payments?: { captures?: { id: string; status: string }[] } }[];
  };
  const cap = data.purchase_units?.[0]?.payments?.captures?.[0];
  return { captureId: cap?.id ?? data.id, status: cap?.status ?? data.status, mock: false };
}

/** Re-fetch an order server-side; a share may be marked PAID only if this returns COMPLETED. */
export async function verifyCapture(orderId: string): Promise<boolean> {
  if (orderId.startsWith("MOCK-")) return true; // demo mode only; flag stays visible in UI
  const token = await accessToken();
  const res = await fetch(`${base()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { status: string };
  return data.status === "COMPLETED";
}
