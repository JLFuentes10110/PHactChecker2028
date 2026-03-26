// ─────────────────────────────────────────────
//  PH-FC-2028 · Dashboard page
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { claimsApi, verdictsApi, type Claim, type Verdict } from "../services/api";

interface Stats {
  total: number;
  verified: number;
  falseCount: number;
  creditGrabs: number;
  byVerdict: Record<string, number>;
  bySource: Record<string, number>;
}

function computeStats(claims: Claim[], verdicts: Verdict[]): Stats {
  const verdictMap: Record<string, Verdict[]> = {};
  for (const v of verdicts) {
    (verdictMap[v.claim_id] ??= []).push(v);
  }
  const stats: Stats = {
    total: claims.length,
    verified: 0,
    falseCount: 0,
    creditGrabs: 0,
    byVerdict: {},
    bySource: {},
  };
  for (const c of claims) {
    stats.bySource[c.source] = (stats.bySource[c.source] ?? 0) + 1;
    const latest = verdictMap[c.id]?.[0];
    if (latest) {
      stats.byVerdict[latest.tag] = (stats.byVerdict[latest.tag] ?? 0) + 1;
      if (latest.tag === "true" || latest.tag === "mostly_true") stats.verified++;
      if (latest.tag === "false") stats.falseCount++;
      if (latest.tag === "credit_grab") stats.creditGrabs++;
    }
  }
  return stats;
}

const VERDICT_COLORS: Record<string, string> = {
  true:         "#639922",
  mostly_true:  "#97C459",
  misleading:   "#BA7517",
  false:        "#E24B4A",
  credit_grab:  "#D85A30",
  unverifiable: "#B4B2A9",
};

export default function DashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollId, setPollId] = useState<number | null>(null); 

const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const c = await claimsApi.list(0, 100);
      setClaims(c);
      const vResults = await Promise.allSettled(
        c.slice(0, 20).map((cl) => verdictsApi.forClaim(cl.id))
      );
      const allVerdicts = vResults.flatMap((r) =>
        r.status === "fulfilled" ? r.value : []
      );
      setVerdicts(allVerdicts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const id = setInterval(() => {
      loadData();
    }, 10000); // 10s

    setPollId(id);

    return () => {
      if (pollId) clearInterval(pollId);
      clearInterval(id);
    };
  }, [loadData]); 

  const stats = computeStats(claims, verdicts);
  const total = Object.values(stats.byVerdict).reduce((a, b) => a + b, 0) || 1;

  const METRIC_CARDS = [
    { label: "Total claims",    value: stats.total,       color: "text-stone-900" },
    { label: "Verified",        value: stats.verified,    color: "text-green-700" },
    { label: "False / misinfo", value: stats.falseCount,  color: "text-red-600" },
    { label: "Credit grabs",    value: stats.creditGrabs, color: "text-orange-600" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-stone-400 text-sm font-mono">
        Loading…
      </div>
    );

  return (
    <div className="p-6 space-y-8">
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRIC_CARDS.map((m) => (
          <div key={m.label} className="bg-stone-100 rounded-lg p-4">
            <p className="text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1">
              {m.label}
            </p>
            <p className={`text-3xl font-bold font-display tracking-tight ${m.color}`}>
              {m.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Verdict distribution bar */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-3">
          Verdict distribution
        </p>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {Object.entries(VERDICT_COLORS).map(([tag, color]) => {
            const pct = ((stats.byVerdict[tag] ?? 0) / total) * 100;
            return pct > 0 ? (
              <div
                key={tag}
                title={`${tag}: ${Math.round(pct)}%`}
                style={{ width: `${pct}%`, background: color }}
              />
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {Object.entries(VERDICT_COLORS).map(([tag, color]) => (
            <span key={tag} className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-sm"
                style={{ background: color }}
              />
              {tag.replace("_", " ")} {Math.round(((stats.byVerdict[tag] ?? 0) / total) * 100)}%
            </span>
          ))}
        </div>
      </div>

      {/* Source breakdown table */}
      <div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-3">
          Claims by source
        </p>
        <div className="border border-stone-100 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(stats.bySource)
                .sort(([, a], [, b]) => b - a)
                .map(([src, count]) => (
                  <tr key={src} className="border-b border-stone-50 last:border-none">
                    <td className="px-4 py-2 font-mono capitalize text-stone-700">{src}</td>
                    <td className="px-4 py-2">
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden w-full">
                        <div
                          className="h-full bg-stone-400 rounded-full"
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-stone-400 font-mono text-xs">
                      {count}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
