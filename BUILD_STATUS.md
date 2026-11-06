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

## Deployment prep (2026-11-06)

- **Public repo exists:** https://github.com/Aminoragit/splitpal-ai — hosted
  under **Aminoragit per the user's decision**; entrant/author is Sojung Na,
  LICENSE copyright is Sojung Na (MIT, present in the repo).
- `[REPO_URL]` placeholders filled with that URL in `SUBMISSION.md` (this repo)
  and in `~/workspace/paypal-rescue-sojungna/PACKAGE.md`. `[DEMO_URL]` /
  `[VIDEO_URL]` are still open.
- **Render blueprint added:** `render.yaml` at the repo root, modelled on the
  PayPal Rescue blueprint but minimal — this app keeps its demo state
  in-memory (`lib/store.ts`), so there is **no database** and no Prisma/seed
  steps:
  - service `splitpal-ai`, Node, free plan
  - build: `npm install && npm run build`
  - start: `npx next start -p $PORT`
  - env vars `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`
    are `sync: false` (entered later in the Render dashboard, never in git);
    `PAYPAL_ENV` is preset to `sandbox`.
- **Mock-mode assumption verified from `lib/paypal.ts`:** credentials are only
  read inside `paypalConfigured()` / the Orders API calls — nothing at boot or
  import time requires them. With both vars empty the app boots and runs in
  clearly-labelled DEMO (mock) mode. Re-verified 2026-11-06: production build
  passes and `next start` with no PayPal env vars serves HTTP 200.
  (Note: the app derives the API base from `PAYPAL_ENV`, defaulting to the
  Sandbox host; `PAYPAL_BASE_URL` is declared in the blueprint for parity
  with the Rescue setup but is not read by the current code.)

### Remaining deployment steps (browser phase, parent/entrant)

1. Parent pushes the latest local commit to Aminoragit/splitpal-ai via the
   GitHub snapshot flow (sync record:
   `~/workspace/splitpal-ai.muse-github-snapshot-sync.json`).
2. On Render: **New → Blueprint**, select the GitHub repo
   `Aminoragit/splitpal-ai` — the user may need to approve/grant Render's
   GitHub access to that repo first — then **Apply**. Render reads
   `render.yaml` and creates the free `splitpal-ai` web service.
3. (Optional, in the Render dashboard — values are `sync: false`, so Render
   prompts for them at blueprint creation and they can also be added later
   under Environment): enter the PayPal **Sandbox** `PAYPAL_CLIENT_ID` /
   `PAYPAL_CLIENT_SECRET` to switch payments from labelled mock mode to real
   Sandbox Orders. Skipping this is fine for a first deploy — the demo still
   boots and runs in mock mode.
4. Wait for the first deploy to go live, open the service URL, run the judge
   path (Load sample expense → split → Pay), then fill `[DEMO_URL]` in
   `SUBMISSION.md` and `PACKAGE.md` with the live URL.

## Not yet done (by design — parent/entrant steps)

- Real PayPal **Sandbox** capture run (needs Sandbox app credentials under an
  account 나소정 controls) — code path is in place and exercised only in mock
  mode so far.
- Hosted deployment (blueprint prepared — see "Deployment prep" above),
  demo video, Devpost submission — see `SUBMISSION.md`.
