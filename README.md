# SplitPal AI

> Snap the receipt, let AI split it fairly — everyone settles their share with PayPal in one tap.

SplitPal AI turns a pasted receipt into an itemised, explained split for a group
expense — items assigned per person, tax and tip allocated **proportionally** —
and gives every participant their own **PayPal Orders v2 (Sandbox)** checkout
for exactly their share. The host watches collection happen (Paid / Pending per
person) instead of chasing friends in a group chat.

Built for the **PayPal AI Hackathon** on Devpost. Submission package:
`~/workspace/paypal-rescue-sojungna/PACKAGE.md` (kept outside this repo).

## How it works

1. **Capture** — paste receipt text (one item per line, price at the end).
   A deterministic parser extracts line items (`2 x Draft Beer 4500` works);
   low-confidence lines are flagged for the host to check.
2. **Split** — assign each item to a person or *Shared*. A deterministic split
   engine (`lib/split.ts`) computes subtotals and allocates tax/tip
   proportionally, in whole currency units, so **shares always sum exactly to
   the bill total**. The AI layer never calculates amounts.
3. **Explain** — each participant gets a short per-person breakdown and a
   polite reminder draft (`lib/explain.ts`), quoting the engine's numbers
   verbatim.
4. **Settle** — one PayPal order per share (`lib/paypal.ts`, Orders v2,
   idempotency key per share). A share is marked **PAID** only after capture
   and a server-side re-check of the order status.

## Run it (judges)

No login needed. All payments are PayPal **Sandbox** — no real money moves.

```bash
npm install
cp .env.example .env   # optional: add your own PayPal Sandbox credentials
npm run dev            # http://localhost:3000
```

- **Without credentials** the app runs in clearly-labelled **DEMO MODE**:
  orders/captures get `MOCK-*` IDs and every mock payment is badged in the UI.
  The full flow (parse → split → explain → pay → dashboard) still works.
- **With Sandbox credentials** (`PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`
  from developer.paypal.com → Apps & Credentials → Sandbox), the real Orders
  v2 path is used: create order → buyer approval → capture → verify.

### Fastest judge path (≈2 minutes)

1. Open the app, click **Load sample expense** (4-person dinner, pre-filled).
2. **Parse receipt** → check items → assign one item to a person → **Confirm split**.
3. Read a participant's explanation card.
4. Click **Pay with PayPal** for two participants (in DEMO MODE this completes
   instantly with a labelled mock capture; in Sandbox mode complete the
   Sandbox buyer checkout).
5. The dashboard flips those shares to **PAID** and updates collected /
   outstanding totals. Unpaid cards show a ready-to-send reminder draft.

## Tests

```bash
npm test   # parser cases + split-engine invariants (sum-to-total, proportional tax/tip, rounding)
npm run build
```

## Stack

Next.js · TypeScript · React · Node.js · PayPal Orders v2 API (Sandbox) ·
deterministic split engine · template/AI explanation layer

## AI / tools disclosure

- **In the product:** an explanation layer generates per-person share
  breakdowns and reminder drafts from the *already-computed* split; receipt
  extraction in this build is a deterministic parser with an LLM-extraction
  slot designed in the submission package. The model layer is **never** used
  to calculate amounts or create/capture payments.
- **Sponsor tools:** PayPal Developer Platform (Sandbox, Orders v2).
- **Development:** designed and directed by the entrant; AI coding assistants
  were used for code drafting/debugging under the entrant's direction. This is
  an original, separate project — no code, text, or assets from any other
  hackathon entry were reused.

## Licence

MIT — see `LICENSE`.
