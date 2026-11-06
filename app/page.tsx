"use client";

import { useMemo, useState } from "react";

interface Item {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  confidence: "high" | "low";
  assignee: string;
}
interface Share {
  person: string;
  total: number;
  status: "PENDING" | "PAID";
  orderId?: string;
  captureId?: string;
  mock?: boolean;
  explanation: string;
  reminder: string;
}

const SAMPLE_RECEIPT = `Margherita Pizza 18000
2 x Draft Beer 4500
Caesar Salad 7000
Garlic Bread 6000
Sparkling Water 3000`;
const SAMPLE_PEOPLE = "Minji, Junho, Sara, Tom";

const fmt = (n: number) => "₩" + n.toLocaleString("en-US");

export default function Home() {
  const [receipt, setReceipt] = useState("");
  const [peopleText, setPeopleText] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [tax, setTax] = useState(0);
  const [tip, setTip] = useState(0);
  const [shares, setShares] = useState<Share[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const people = useMemo(
    () => peopleText.split(",").map((p) => p.trim()).filter(Boolean),
    [peopleText],
  );
  const collected = shares.filter((s) => s.status === "PAID").reduce((a, s) => a + s.total, 0);
  const outstanding = shares.filter((s) => s.status !== "PAID").reduce((a, s) => a + s.total, 0);

  async function parse() {
    setError("");
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: receipt }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Parse failed.");
    setItems(data.items.map((i: Item) => ({ ...i, assignee: "SHARED" })));
    setShares([]);
  }

  async function compute() {
    setError("");
    const res = await fetch("/api/split", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        people,
        tax,
        tip,
        items: items.map((i) => ({ name: i.name, lineTotal: i.lineTotal, assignee: i.assignee })),
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Split failed.");
    setShares(data.shares);
  }

  async function pay(person: string) {
    setBusy(person);
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person }),
    });
    const data = await res.json();
    setBusy("");
    if (!res.ok) return setError(data.error ?? "Payment failed.");
    if (data.approveUrl) {
      window.open(data.approveUrl, "_blank");
      return;
    }
    setShares(data.shares);
  }

  return (
    <main>
      <h1>SplitPal AI</h1>
      <p className="sub">
        Snap the receipt, let AI split it fairly — everyone settles their share with PayPal in one tap.
      </p>

      <section className="card">
        <h2>1 · Capture the expense</h2>
        <div className="row" style={{ marginBottom: 10 }}>
          <button
            className="secondary"
            onClick={() => {
              setReceipt(SAMPLE_RECEIPT);
              setPeopleText(SAMPLE_PEOPLE);
              setTax(3900);
              setTip(4300);
            }}
          >
            Load sample expense
          </button>
          <span className="small">One item per line, price at the end. Try “2 x Draft Beer 4500”.</span>
        </div>
        <textarea
          value={receipt}
          onChange={(e) => setReceipt(e.target.value)}
          placeholder={"Margherita Pizza 18000\n2 x Draft Beer 4500\nCaesar Salad 7000"}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <input
            type="text"
            style={{ flex: 1, minWidth: 240 }}
            value={peopleText}
            onChange={(e) => setPeopleText(e.target.value)}
            placeholder="Participants, comma separated — e.g. Minji, Junho, Sara"
          />
          <button onClick={parse} disabled={!receipt.trim()}>Parse receipt</button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      {items.length > 0 && (
        <section className="card">
          <h2>2 · Assign items &amp; confirm the split</h2>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Total</th><th>Belongs to</th></tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}{item.confidence === "low" ? " ⚠︎ check" : ""}</td>
                  <td>{item.qty}</td>
                  <td>{fmt(item.lineTotal)}</td>
                  <td>
                    <select
                      value={item.assignee}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...next[idx], assignee: e.target.value };
                        setItems(next);
                      }}
                    >
                      <option value="SHARED">Shared by all</option>
                      {people.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ marginTop: 12 }}>
            <label>Tax ₩ <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} style={{ width: 110 }} /></label>
            <label>Tip ₩ <input type="number" value={tip} onChange={(e) => setTip(Number(e.target.value))} style={{ width: 110 }} /></label>
            <button onClick={compute} disabled={people.length < 2}>Confirm split</button>
            <span className="small">Tax &amp; tip are allocated proportionally to each person&apos;s items. Amounts are computed by a deterministic engine — never by the AI layer.</span>
          </div>
        </section>
      )}

      {shares.length > 0 && (
        <section className="card">
          <h2>3 · Host dashboard — collection status</h2>
          <p className="small">
            Collected <strong>{fmt(collected)}</strong> · Outstanding <strong>{fmt(outstanding)}</strong> ·{" "}
            {shares.filter((s) => s.status === "PAID").length}/{shares.length} paid
          </p>
          <div className="grid">
            {shares.map((s) => (
              <div className="person" key={s.person}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{s.person}</strong>
                  <span className={`badge ${s.status === "PAID" ? "paid" : "pending"}`}>{s.status}</span>
                </div>
                <div className="amount">{fmt(s.total)}</div>
                <p className="small">{s.explanation}</p>
                {s.status === "PAID" ? (
                  <p className="small">
                    {s.mock && <span className="badge mock">DEMO MODE — mock payment</span>}{" "}
                    Capture: {s.captureId}
                  </p>
                ) : (
                  <>
                    <button onClick={() => pay(s.person)} disabled={busy === s.person}>
                      {busy === s.person ? "Processing…" : "Pay with PayPal"}
                    </button>
                    <p className="small" style={{ marginTop: 10 }}>
                      Reminder draft: “{s.reminder}”
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className="small" style={{ marginTop: 12 }}>
            Payments run on PayPal Sandbox when Sandbox credentials are configured; otherwise the app
            runs in clearly-labelled DEMO MODE with mock orders — no real money ever moves.
          </p>
        </section>
      )}
    </main>
  );
}
