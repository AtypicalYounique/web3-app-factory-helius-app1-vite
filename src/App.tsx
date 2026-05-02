import { useMemo, useRef, useState, type CSSProperties } from "react";
import { BRAND } from "./brand";

const APP_TITLE = "Solana Transaction Landing & RPC Reliability Risk Mapper";
const APP_TAGLINE =
  "A directional, pattern-based diagnostic for Solana dApp and trading teams thinking about whether their current RPC + transaction landing setup is good enough, informed by patterns Helius and other Solana infra teams talk about publicly.";

type Question = { id: string; label: string; type: "pills"; options: string[] };

const Q: Question[] = [
  {
    id: "appType",
    label: "What best describes your app?",
    type: "pills",
    options: [
      "Consumer dApp / wallet",
      "DeFi (DEX, lending, perps)",
      "NFT / marketplace",
      "Trading firm / market maker",
      "Onchain game",
      "Indexer / data product",
    ],
  },
  {
    id: "txnSensitivity",
    label: "How time-sensitive is transaction landing for your users?",
    type: "pills",
    options: [
      "Low (a few seconds is fine)",
      "Medium (sub-second feels right)",
      "High (every slot matters: perps, sniping, MEV)",
    ],
  },
  {
    id: "txnVolume",
    label: "Roughly how many user-facing transactions per day at peak?",
    type: "pills",
    options: ["< 1k", "1k–10k", "10k–100k", "100k–1M", "1M+"],
  },
  {
    id: "rpcSetup",
    label: "Current RPC setup",
    type: "pills",
    options: [
      "Single shared public RPC",
      "Single paid provider, single region",
      "Single paid provider, multi-region",
      "Multiple providers with fallback",
      "Self-hosted node(s) + provider mix",
    ],
  },
  {
    id: "stream",
    label: "How do you consume on-chain events today?",
    type: "pills",
    options: [
      "Polling getSignaturesForAddress / getProgramAccounts",
      "Public WebSocket subscription",
      "Provider WebSockets (e.g. enhanced)",
      "Geyser / gRPC stream (e.g. Yellowstone or LaserStream-style)",
      "Webhooks from a provider",
      "Mix",
    ],
  },
  {
    id: "priorityFees",
    label: "Do you set Solana priority fees per transaction?",
    type: "pills",
    options: [
      "No / hardcoded zero",
      "Static value (same for every tx)",
      "Hardcoded tiers (low/med/high)",
      "Dynamic estimation from an API",
      "Dynamic + per-account / per-program awareness",
    ],
  },
  {
    id: "stakedConn",
    label: "Are you using staked connections for sends?",
    type: "pills",
    options: ["No", "Not sure", "Yes, on a paid plan"],
  },
  {
    id: "userPain",
    label: "What pattern do users complain about most?",
    type: "pills",
    options: [
      "Stuck / unconfirmed transactions during congestion",
      "Stale balances or stale UI reads",
      "Slow page loads / slow event updates",
      "Failed mints, fills, or claims at peak",
      "Nothing major, just nice-to-haves",
    ],
  },
  {
    id: "region",
    label: "Where do most of your users live?",
    type: "pills",
    options: [
      "Mostly US",
      "Mostly EU",
      "Mostly Asia",
      "LatAm / MENA / mixed",
      "Truly global",
    ],
  },
];

type Answers = Record<string, string>;

const RISK: Record<string, Record<string, number>> = {
  appType: {
    "Consumer dApp / wallet": 1,
    "DeFi (DEX, lending, perps)": 2,
    "NFT / marketplace": 1.5,
    "Trading firm / market maker": 3,
    "Onchain game": 1.5,
    "Indexer / data product": 1,
  },
  txnSensitivity: {
    "Low (a few seconds is fine)": 0.5,
    "Medium (sub-second feels right)": 1.5,
    "High (every slot matters: perps, sniping, MEV)": 3,
  },
  txnVolume: { "< 1k": 0.5, "1k–10k": 1, "10k–100k": 2, "100k–1M": 3, "1M+": 3.5 },
  rpcSetup: {
    "Single shared public RPC": 3.5,
    "Single paid provider, single region": 2.5,
    "Single paid provider, multi-region": 1.5,
    "Multiple providers with fallback": 0.8,
    "Self-hosted node(s) + provider mix": 0.7,
  },
  stream: {
    "Polling getSignaturesForAddress / getProgramAccounts": 3,
    "Public WebSocket subscription": 2.5,
    "Provider WebSockets (e.g. enhanced)": 1.2,
    "Geyser / gRPC stream (e.g. Yellowstone or LaserStream-style)": 0.7,
    "Webhooks from a provider": 1,
    Mix: 1.2,
  },
  priorityFees: {
    "No / hardcoded zero": 3,
    "Static value (same for every tx)": 2.2,
    "Hardcoded tiers (low/med/high)": 1.5,
    "Dynamic estimation from an API": 0.7,
    "Dynamic + per-account / per-program awareness": 0.4,
  },
  stakedConn: { No: 1.5, "Not sure": 1.5, "Yes, on a paid plan": 0.4 },
  userPain: {
    "Stuck / unconfirmed transactions during congestion": 3,
    "Stale balances or stale UI reads": 2,
    "Slow page loads / slow event updates": 1.5,
    "Failed mints, fills, or claims at peak": 2.8,
    "Nothing major, just nice-to-haves": 0.3,
  },
  region: {
    "Mostly US": 0.5,
    "Mostly EU": 0.7,
    "Mostly Asia": 1,
    "LatAm / MENA / mixed": 1.2,
    "Truly global": 1.4,
  },
};

const MAX_SCORE = 25;
function score(answers: Answers) {
  let s = 0;
  for (const q of Q) {
    const v = answers[q.id];
    if (!v) continue;
    s += RISK[q.id]?.[v] ?? 0;
  }
  return Math.min(100, Math.round((s / MAX_SCORE) * 100));
}

type Band = { label: string; color: string; tone: "good" | "warn" | "bad" };
function band(pct: number): Band {
  if (pct < 25) return { label: "Looks healthy", color: "var(--good)", tone: "good" };
  if (pct < 50) return { label: "Some watchpoints", color: "var(--accent-2)", tone: "good" };
  if (pct < 70) return { label: "Real risk surfaces", color: "var(--warn)", tone: "warn" };
  return { label: "High landing/reliability risk", color: "var(--bad)", tone: "bad" };
}

function recos(answers: Answers): string[] {
  const r: string[] = [];
  if (["No / hardcoded zero", "Static value (same for every tx)"].includes(answers.priorityFees)) {
    r.push(
      "Look at dynamic priority-fee estimation from a serialized-transaction-aware API rather than static or zero fees. This is one of the most cited reasons Solana txns fail to land at peak."
    );
  }
  if (answers.stakedConn === "No" || answers.stakedConn === "Not sure") {
    if (
      ["DeFi (DEX, lending, perps)", "Trading firm / market maker", "NFT / marketplace"].includes(answers.appType) ||
      answers.txnSensitivity === "High (every slot matters: perps, sniping, MEV)"
    ) {
      r.push(
        "If transaction landing actually matters to your business, staked connections (available on paid Solana RPC plans) are worth comparing against your current send path."
      );
    }
  }
  if (["Single shared public RPC", "Single paid provider, single region"].includes(answers.rpcSetup)) {
    r.push(
      "A single-region RPC is a single point of failure during regional issues or DDoS events. Even a soft second provider with circuit-breaking would meaningfully reduce downside risk."
    );
  }
  if (answers.stream === "Polling getSignaturesForAddress / getProgramAccounts") {
    r.push(
      "Heavy polling tends to eat credits and lag during congestion. A push-based stream (provider Webhooks or a Geyser/gRPC-class stream like LaserStream/Yellowstone) usually pays for itself in latency and cost."
    );
  }
  if (answers.stream === "Public WebSocket subscription") {
    r.push(
      "Public Solana WebSockets are notorious for silent disconnects under load. Provider-grade enhanced WebSockets or push Webhooks generally hold up better."
    );
  }
  if (answers.userPain === "Stuck / unconfirmed transactions during congestion") {
    r.push(
      "This is the textbook 'priority fee + staked send + retry strategy' problem. If you do nothing else, instrument landing rate by route and start there."
    );
  }
  if (answers.userPain === "Stale balances or stale UI reads") {
    r.push(
      "Stale reads usually point to RPC node lag or read replica skew. Consider a stream-driven UI cache rather than polling reads on the hot path."
    );
  }
  if (answers.userPain === "Failed mints, fills, or claims at peak") {
    r.push(
      "Peak-event failures often combine three issues: under-priced priority fees, unstaked sends, and lack of a retry/backoff strategy keyed on slot. All three are addressable independently."
    );
  }
  if (answers.region === "Truly global" || answers.region === "Mostly Asia" || answers.region === "LatAm / MENA / mixed") {
    r.push(
      "Global users see real RPC latency variance. Multi-region RPC routing, even just two regions with a health check, usually shows up in user-perceived speed."
    );
  }
  if (answers.appType === "Trading firm / market maker") {
    r.push(
      "Trading workloads are the case where 'every slot matters' is literal. Dedicated, region-pinned, staked send paths and direct streaming are usually how serious teams remove variance."
    );
  }
  if (answers.txnVolume === "1M+" || answers.txnVolume === "100k–1M") {
    r.push(
      "At your volume, request-class separation (reads vs sends vs streams) becomes meaningful. Co-locating everything on one endpoint magnifies any single failure mode."
    );
  }
  return Array.from(new Set(r)).slice(0, 5);
}

function brief(answers: Answers, pct: number, b: Band, recosList: string[]) {
  const lines: string[] = [];
  lines.push(`Solana Transaction Landing & RPC Reliability Risk Mapper`);
  lines.push(`Risk score: ${pct} / 100 · ${b.label}`);
  lines.push(``);
  lines.push(`Profile:`);
  for (const q of Q) {
    if (answers[q.id]) lines.push(`  • ${q.label.replace(/\?$/, "")}: ${answers[q.id]}`);
  }
  lines.push(``);
  lines.push(`Recommendations:`);
  recosList.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
  lines.push(``);
  lines.push(
    `What this suggests: directional reliability/landing risk based on your inputs, not a claim about your internal stack.`
  );
  lines.push(`What this does not prove: anything specific about your current providers or architecture.`);
  lines.push(
    `Useful next steps: instrument landing rate per route, log fee tier vs. landing, A/B a streaming path against polling, and add a second region/provider with health checks.`
  );
  return lines.join("\n");
}

export default function App() {
  const [answers, setAnswers] = useState<Answers>({});
  const [showResult, setShowResult] = useState(false);
  const [toast, setToast] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const set = (id: string, v: string) => setAnswers((a) => ({ ...a, [id]: v }));
  const allAnswered = Q.every((q) => answers[q.id]);

  const pct = useMemo(() => score(answers), [answers]);
  const b = useMemo(() => band(pct), [pct]);
  const recosList = useMemo(() => recos(answers), [answers]);

  const onGenerate = () => {
    setShowResult(true);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const onCopy = async () => {
    const text = brief(answers, pct, b, recosList);
    try {
      await navigator.clipboard.writeText(text);
      setToast(true);
      setTimeout(() => setToast(false), 1600);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setToast(true);
      setTimeout(() => setToast(false), 1600);
    }
  };

  const reset = () => {
    setAnswers({});
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ringStyle: CSSProperties = {
    ["--score" as any]: pct,
    ["--ring-color" as any]: b.color,
  };

  return (
    <div className="wrap">
      <header className="brand-bar">
        <a
          href={BRAND.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-logo"
          aria-label={BRAND.company}
          dangerouslySetInnerHTML={{ __html: BRAND.logoSvg }}
        />
        <span className="brand-chip">Independent diagnostic</span>
      </header>
      <div className="eyebrow">For Solana dApp & trading teams · Pattern-based</div>
      <h1>{APP_TITLE}</h1>
      <p className="lede">{APP_TAGLINE}</p>

      <div className="card form-card">
        {Q.map((q) => (
          <div key={q.id} style={{ marginBottom: 16 }}>
            <label>{q.label}</label>
            <div className="pillgroup">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  className={"pill " + (answers[q.id] === opt ? "active" : "")}
                  onClick={() => set(q.id, opt)}
                  type="button"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn"
            disabled={!allAnswered}
            onClick={onGenerate}
            style={{ opacity: allAnswered ? 1 : 0.45, cursor: allAnswered ? "pointer" : "not-allowed" }}
          >
            Generate diagnostic
          </button>
          <button className="btn secondary" onClick={reset}>
            Reset
          </button>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            {allAnswered ? "Ready." : `${Object.keys(answers).length}/${Q.length} answered`}
          </span>
        </div>
      </div>

      {showResult && allAnswered && (
        <div ref={resultRef}>
          <div className="pdf-date">
            Generated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>

          <div className="card">
            <h2>Your inputs</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14, lineHeight: 1.6 }}>
              {Q.map((q) =>
                answers[q.id] ? (
                  <div key={q.id}>
                    <strong>{q.label.replace(/\?$/, "")}:</strong> {answers[q.id]}
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="card">
            <div className="score-block">
              <div className="score-ring" style={ringStyle}>
                <div>{pct}</div>
              </div>
              <div>
                <div className={"tag " + b.tone}>{b.label}</div>
                <h2 style={{ marginTop: 8 }}>Directional risk score</h2>
                <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
                  Based on your inputs, this is the rough surface area for transaction-landing and RPC reliability friction during Solana congestion. Lower is better. This is a pattern, not a measurement.
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Top recommendations</h2>
            <ul className="ticks">
              {recosList.length === 0 && <li>No major patterns flagged. Worth instrumenting landing rate anyway as baseline.</li>}
              {recosList.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="row">
            <div className="card tight">
              <h2>What this suggests</h2>
              <div style={{ color: "#cdd3df", fontSize: 14, lineHeight: 1.6 }}>
                Surface areas where Solana txn flows commonly break under load: priority fee strategy, staked send paths, RPC region/provider redundancy, and stream consumption pattern.
              </div>
            </div>
            <div className="card tight">
              <h2>What this does not prove</h2>
              <div style={{ color: "#cdd3df", fontSize: 14, lineHeight: 1.6 }}>
                Anything specific about your current vendor, your internal architecture, or your team's competence. Real diagnosis needs landing-rate metrics, slot-level traces, and per-region telemetry.
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Questions worth asking next</h2>
            <ul className="ticks">
              <li>What is our current landing rate, broken down by route, by hour, and by priority-fee tier?</li>
              <li>Which user-facing flows touch a single RPC endpoint with no fallback?</li>
              <li>Are we using staked connections for transaction sends, and do we know which sends actually matter most?</li>
              <li>What does a 200ms p99 RPC latency cost us in user behavior, retries, or abandoned flows?</li>
              <li>If our primary stream provider had a 30-minute degradation right now, what would users see?</li>
            </ul>
          </div>

          <div className="card actions-card">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" onClick={onCopy}>
                Copy this brief
              </button>
              <button className="btn secondary" onClick={() => window.print()}>
                Download PDF
              </button>
              <button className="btn secondary" onClick={reset}>
                Run again with new inputs
              </button>
            </div>
          </div>

          <div className="pdf-footer">
            An independent tool by Ryan Lacerda. Not affiliated with {BRAND.company}. Visit {BRAND.company.toLowerCase()} at {BRAND.homepage}.
          </div>
        </div>
      )}

      <div className="footer-note">
        This is a directional, pattern-based diagnostic. It does not measure your stack and it does not claim anything about specific providers. It draws on patterns publicly discussed by Solana infrastructure teams (priority fees, staked connections, multi-region RPC, Geyser/gRPC-class streaming, Webhooks). Treat it as a conversation starter, not a verdict.
        <div className="branding">Built as a value-first artifact. No accounts, no data collected, runs locally in your browser.</div>
      </div>

      <footer className="attribution">{BRAND.attribution}</footer>

      <div className={"toast " + (toast ? "show" : "")}>Brief copied to clipboard</div>
    </div>
  );
}
