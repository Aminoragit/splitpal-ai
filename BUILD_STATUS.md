# Build status — SplitPal AI MVP

Built: 2026-11-06 (KST), fresh code in `~/workspace/splitpal-ai/`.
Not reused from PayPal Rescue: code, repo, text, demo assets — all new.

## What was built

- **Next.js + TypeScript app** (App Router, React 19), plain CSS UI.
- `lib/parser.ts` — deterministic receipt-text parser (qty prefixes/suffixes,
  comma prices, low-confidence flags). No LLM in the money path.
- `lib/split.ts` — deterministic split engine: per-person/shared items,
  **proportional tax & tip**, whole-unit rounding with deterministic
  remainder assignment; shares always sum exactly to the grand total.
- `lib/explain.ts` — explanation layer: per-person share breakdown +
  reminder draft, quoting engine numbers verbatim only.
- `lib/paypal.ts` — PayPal Orders v2 real code path (OAuth → create order
  with per-share idempotency key → capture → server-side verify) against
  `api-m.sandbox.paypal.com`; when no credentials are set it returns
  clearly-labelled `MOCK-*` IDs and the UI badges payments as DEMO MODE.
- API routes: `/api/parse`, `/api/split`, `/api/pay`; in-memory demo store
  (`lib/store.ts`).
- UI flow: paste receipt / **Load sample expense** → parse → assign items →
  tax/tip → confirm split → host dashboard (Paid/Pending, collected /
  outstanding) → per-person Pay with PayPal → reminder draft for unpaid.
- `README.md` (judge run instructions), MIT `LICENSE`, `.env.example`,
  `SUBMISSION.md` linking to the Devpost package.

## Verification (2026-11-06, local)

| Check | Result |
|---|---|
| `npm install` | ✅ 28 packages |
| `npm test` | ✅ parser cases + split invariants (sum-to-total with rounding-forcing tax ₩1,001 / tip ₩777; explanation quotes engine total) — ALL TESTS PASSED |
| `npm run build` | ✅ all routes compiled (`/`, `/api/parse`, `/api/split`, `/api/pay`) |
| Server run (`next start`, port 3210) | ✅ home page HTTP 200 |
| E2E mock flow (sample 4-person dinner) | ✅ parse → 5 items; split grand total ₩51,200 = sum of shares ₩51,200 (Minji 16,372 / Junho 18,754 / Sara 8,037 / Tom 8,037); Minji pay → PAID with `MOCK-ORDER-Minji-16372` / `MOCK-CAPTURE-Minji-16372`, mode `demo-mock`; Junho pay → PAID; dashboard showed 2 PAID / 2 PENDING |

## Not yet done (by design — parent/entrant steps)

- Real PayPal **Sandbox** capture run (needs Sandbox app credentials under an
  account 나소정 controls) — code path is in place and exercised only in mock
  mode so far.
- Public GitHub repo under 나소정's account + push (local git only here).
- Hosted deployment, demo video, Devpost submission — see `SUBMISSION.md`.
