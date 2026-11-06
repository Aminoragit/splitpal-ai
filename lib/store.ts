// SplitPal AI — in-memory demo store.
// Deliberately minimal for the hackathon MVP: one active expense at a time,
// kept on the server process. Swap for a database without touching the API
// contract (the routes below are the only consumers).

import type { SplitResult } from "./split";

export interface ShareRecord {
  person: string;
  total: number;
  status: "PENDING" | "PAID";
  orderId?: string;
  captureId?: string;
  mock?: boolean;
  explanation: string;
  reminder: string;
}

export interface ExpenseState {
  split: SplitResult;
  shares: ShareRecord[];
}

declare global {
  // eslint-disable-next-line no-var
  var __splitpalState: ExpenseState | null | undefined;
}

export function getState(): ExpenseState | null {
  return globalThis.__splitpalState ?? null;
}

export function setState(state: ExpenseState): void {
  globalThis.__splitpalState = state;
}
