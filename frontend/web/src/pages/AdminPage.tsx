// ─────────────────────────────────────────────
//  PH-FC-2028 · Admin Moderation Panel
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import {
  claimsApi, verdictsApi,
  type Claim, type Verdict, type VerdictTag,
} from "../services/api";
import { VerdictBadge, SourceBadge, StatusBadge } from "../components/Badges";

const VERDICT_OPTIONS: VerdictTag[] = [
  "true", "mostly_true", "misleading", "false", "unverifiable", "credit_grab",
];

interface Row {
  claim: Claim;
  verdict?: Verdict;
}

interface OverrideState {
  claimId: string;
  tag: VerdictTag;
  confidence: string;
  explanation: string;
}

export default function AdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [override, setOverride] = useState<OverrideState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const claims = await claimsApi.list(0, 50);
      const enriched = await Promise.all(
        claims.map(async (c) => {
          const verdicts = await verdictsApi.forClaim(c.id).catch(() => []);
          return { claim: c, verdict: verdicts[0] };
        })
      );
      setRows(enriched);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openOverride = (r: Row) =>
    setOverride({
      claimId: r.claim.id,
      tag: r.verdict?.tag ?? "unverifiable",
      confidence: String(r.verdict?.confidence ?? 0.5),
      explanation: r.verdict?.explanation ?? "",
    });

  const submitOverride = async () => {
    if (!override) return;
    setSubmitting(true);
    try {
      await verdictsApi.create({
        claim_id: override.claimId,
        tag: override.tag,
        confidence: parseFloat(override.confidence),
        explanation: override.explanation,
        reviewed_by: "admin", // TODO: plug in auth user
      });
      showToast("Verdict saved successfully");
      setOverride(null);
      load();
    } catch (e) {
      showToast(`Error: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = rows.filter((r) => r.claim.status === "pending").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Moderation panel</h2>
          <p className="text-[11px] font-mono text-stone-400 mt-0.5">
            {pendingCount} pending · {rows.length} total
          </p>
        </div>
        <button
          onClick={load}
          className="text-xs font-mono px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50"
        >
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-stone-400 font-mono">Loading claims…</p>
      ) : (
        <div className="border border-stone-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                {["ID", "Source", "Lang", "Claim", "Status", "Verdict", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-stone-400 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ claim, verdict }) => (
                <tr
                  key={claim.id}
                  className="border-b border-stone-50 last:border-none hover:bg-stone-50/50"
                >
                  <td className="px-3 py-3 font-mono text-[10px] text-stone-300">
                    #{claim.id.slice(0, 8)}
                  </td>
                  <td className="px-3 py-3">
                    <SourceBadge source={claim.source} />
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] text-stone-400">
                    {claim.language}
                  </td>
                  <td className="px-3 py-3 max-w-[200px]">
                    <p className="truncate text-xs text-stone-700">{claim.raw_text}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-3 py-3">
                    {verdict ? (
                      <VerdictBadge tag={verdict.tag} confidence={verdict.confidence} />
                    ) : (
                      <span className="text-stone-300 text-xs font-mono">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => openOverride({ claim, verdict })}
                      className="text-[10px] font-mono px-2 py-1 border border-stone-200 rounded hover:bg-stone-100 mr-1.5"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Override modal */}
      {override && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setOverride(null)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display font-bold text-base mb-1">Override verdict</h3>
            <p className="text-[11px] font-mono text-stone-400 mb-5">
              Claim #{override.claimId.slice(0, 8)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
                  Verdict tag
                </label>
                <select
                  value={override.tag}
                  onChange={(e) => setOverride({ ...override, tag: e.target.value as VerdictTag })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400"
                >
                  {VERDICT_OPTIONS.map((v) => (
                    <option key={v} value={v}>{v.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
                  Confidence ({Math.round(parseFloat(override.confidence) * 100)}%)
                </label>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={override.confidence}
                  onChange={(e) => setOverride({ ...override, confidence: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
                  Explanation
                </label>
                <textarea
                  value={override.explanation}
                  onChange={(e) => setOverride({ ...override, explanation: e.target.value })}
                  rows={3}
                  placeholder="Why is this verdict correct?"
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOverride(null)}
                className="flex-1 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={submitOverride}
                disabled={submitting}
                className="flex-1 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save verdict →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-stone-900 text-white text-xs font-mono px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
