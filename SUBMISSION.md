# Submission notes — SplitPal AI (나소정, PayPal AI Hackathon)

- Full Devpost submission text + build plan: `~/workspace/paypal-rescue-sojungna/PACKAGE.md`
- Official deadline: **2026-11-13 05:00 KST** · Internal target: **2026-11-12 23:59 KST**
- This repo is original and separate from 최석원's PayPal Rescue (different
  product, problem, codebase, name). Do not merge or cross-link the two entries.

## Placeholders to fill before submitting (from PACKAGE.md §3)

- Repository — https://github.com/Aminoragit/splitpal-ai — public repo hosted
  under **Aminoragit** per the user's decision; entrant/author is **Sojung Na**
  and the LICENSE copyright is Sojung Na (MIT licence visible in the repo).
- Demo: https://splitpal-ai.onrender.com — live on Render (free plan; may sleep, first load can take ~50s). Currently runs in labelled DEMO MODE until PayPal Sandbox credentials are added in the Render dashboard.
- `[VIDEO_URL]` — public YouTube demo video, < 3 min (not yet recorded)
- Gallery screenshots — capture from the running app
- Update PACKAGE.md "Challenges" / "Accomplishments" with real build facts
  (see BUILD_STATUS.md) and real Sandbox capture IDs once Sandbox credentials
  are wired and ≥2 real Sandbox captures are done.

## Remaining (parent/entrant, browser work)

1. Confirm eligibility facts (PACKAGE.md §5.1).
2. 나소정's own Devpost account → Join Hackathon.
3. ~~Create public GitHub repo~~ — DONE: https://github.com/Aminoragit/splitpal-ai
   (public, MIT licence, hosted under Aminoragit per the user's decision;
   entrant/author Sojung Na). Latest local commits are pushed by the parent
   via the GitHub snapshot flow.
4. PayPal Sandbox app credentials under an account she controls → set env →
   run ≥2 real Sandbox captures → record capture IDs.
5. Deploy hosted demo — a Render blueprint (`render.yaml`) is prepared in the
   repo root: create the service on Render from the GitHub repo
   (Aminoragit/splitpal-ai) and optionally enter PayPal Sandbox credentials
   there; with no credentials the app still runs in clearly-labelled mock mode.
   Or rely on README run steps.
6. Record demo video per PACKAGE.md script, upload public to YouTube.
7. Submit on Devpost by 2026-11-12 23:59 KST and verify the entry appears.
