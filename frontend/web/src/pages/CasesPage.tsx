// ─────────────────────────────────────────────
//  PH-FC-2028 · Legal Cases Browser
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { casesApi, type LegalCase, type CaseType, type CaseStatus } from "../services/api";

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_STYLES: Record<CaseStatus, string> = {
  filed:        "bg-blue-50   text-blue-800   border-blue-200",
  pending:      "bg-amber-50  text-amber-800  border-amber-200",
  on_trial:     "bg-orange-50 text-orange-800 border-orange-200",
  on_appeal:    "bg-purple-50 text-purple-800 border-purple-200",
  dismissed:    "bg-stone-100 text-stone-500  border-stone-200",
  acquitted:    "bg-green-50  text-green-800  border-green-200",
  convicted:    "bg-red-50    text-red-900    border-red-300",
  disqualified: "bg-red-100   text-red-900    border-red-300",
  reinstated:   "bg-teal-50   text-teal-800   border-teal-200",
  unknown:      "bg-stone-50  text-stone-400  border-stone-100",
};

const TYPE_COLORS: Record<CaseType, string> = {
  criminal:                 "bg-red-50    text-red-800   border-red-200",
  administrative:           "bg-blue-50   text-blue-800  border-blue-100",
  sandiganbayan:            "bg-indigo-50 text-indigo-800 border-indigo-200",
  comelec_disqualification: "bg-orange-50 text-orange-800 border-orange-200",
  ombudsman:                "bg-yellow-50 text-yellow-800 border-yellow-200",
  civil:                    "bg-stone-100 text-stone-600  border-stone-200",
};

const CASE_TYPES: CaseType[] = [
  "criminal","administrative","sandiganbayan",
  "comelec_disqualification","ombudsman","civil",
];
const CASE_STATUSES: CaseStatus[] = [
  "filed","pending","on_trial","on_appeal",
  "dismissed","acquitted","convicted","disqualified","reinstated","unknown",
];

// ── Case card ─────────────────────────────────────────────────────────────

function CaseCard({ c }: { c: LegalCase }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-stone-100 rounded-xl overflow-hidden hover:border-stone-200 transition-colors">
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${TYPE_COLORS[c.case_type]}`}>
                {fmt(c.case_type)}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${STATUS_STYLES[c.status]}`}>
                {fmt(c.status)}
              </span>
              {c.case_number && (
                <code className="text-[10px] font-mono text-stone-400">{c.case_number}</code>
              )}
            </div>
            <p className="text-sm font-medium text-stone-900 leading-snug">{c.title}</p>
          </div>
        </div>

        {/* Subject */}
        {c.subject && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Subject</span>
            <span className="text-xs font-medium text-stone-700">
              {c.subject.full_name}
              {c.subject.alias && <span className="text-stone-400 ml-1">"{c.subject.alias}"</span>}
            </span>
            <span className="text-[10px] font-mono text-stone-400">{fmt(c.subject.position)}</span>
            {c.subject.party && (
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 rounded">{c.subject.party}</span>
            )}
          </div>
        )}

        {/* Charge + court */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-stone-500">
          {c.charge && <span>Charge: <span className="text-stone-700">{c.charge}</span></span>}
          {c.court_body && <span>Court: <span className="text-stone-700">{fmt(c.court_body)}</span></span>}
          {c.date_filed && <span>Filed: <span className="text-stone-700">{c.date_filed}</span></span>}
          {c.date_resolved && <span>Resolved: <span className="text-stone-700">{c.date_resolved}</span></span>}
        </div>

        {/* Expand toggle */}
        {(c.description || c.penalty || c.source_url) && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="mt-3 text-[10px] font-mono text-stone-400 hover:text-stone-600 flex items-center gap-1">
            {expanded ? "▾ Less" : "▸ More"}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-stone-50 px-4 pb-4 pt-3 space-y-2 bg-stone-50/50">
          {c.description && (
            <p className="text-xs text-stone-600 leading-relaxed">{c.description}</p>
          )}
          {c.penalty && (
            <p className="text-xs text-stone-500 font-mono">
              <span className="text-stone-400">Penalty: </span>{c.penalty}
            </p>
          )}
          {c.source_url && (
            <a href={c.source_url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-mono text-stone-400 hover:text-stone-600 underline underline-offset-2 block truncate">
              {c.source_label ?? c.source_url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

const STATUS_SEVERITY: CaseStatus[] = [
  "convicted","disqualified","on_trial","on_appeal",
  "pending","filed","acquitted","dismissed","reinstated","unknown",
];

export default function CasesPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<CaseType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await casesApi.list({
        case_type: typeFilter !== "all" ? typeFilter : undefined,
        status:    statusFilter !== "all" ? statusFilter : undefined,
        q:         q.length >= 2 ? q : undefined,
        limit: 100,
      });
      // Sort by severity
      data.sort((a, b) =>
        STATUS_SEVERITY.indexOf(a.status) - STATUS_SEVERITY.indexOf(b.status)
      );
      setCases(data);
    } finally {
      setLoading(false);
    }
  }, [q, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  // Stats
  const convicted    = cases.filter((c) => c.status === "convicted" || c.status === "disqualified").length;
  const active       = cases.filter((c) => ["filed","pending","on_trial","on_appeal"].includes(c.status)).length;
  const dismissed    = cases.filter((c) => c.status === "dismissed" || c.status === "acquitted").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold tracking-tight">Legal case records</h2>
        <p className="text-[11px] font-mono text-stone-400 mt-0.5">
          {cases.length} cases · {active} active · {convicted} convicted/disqualified · {dismissed} dismissed/acquitted
        </p>
      </div>

      {/* Severity summary bar */}
      {cases.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {convicted > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-0.5">Convicted / Disq.</p>
              <p className="text-xl font-bold text-red-700">{convicted}</p>
            </div>
          )}
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400 mb-0.5">Active</p>
            <p className="text-xl font-bold text-orange-700">{active}</p>
          </div>
          <div className="bg-stone-100 border border-stone-200 rounded-lg px-4 py-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-0.5">Dismissed</p>
            <p className="text-xl font-bold text-stone-600">{dismissed}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2 mb-5">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, charge, or case number…"
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400" />
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", ...CASE_TYPES] as const).map((t) => (
            <button key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-[11px] font-mono px-3 py-1 rounded-md border transition-colors ${
                typeFilter === t
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
              }`}>
              {t === "all" ? "All types" : fmt(t)}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", ...CASE_STATUSES] as const).map((s) => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-[11px] font-mono px-3 py-1 rounded-md border transition-colors ${
                statusFilter === s
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
              }`}>
              {s === "all" ? "All statuses" : fmt(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-[11px] font-mono text-stone-400 mb-3">
        {loading ? "Searching…" : `${cases.length} result${cases.length !== 1 ? "s" : ""}`}
      </p>

      {loading ? (
        <p className="text-sm text-stone-400 font-mono">Loading cases…</p>
      ) : cases.length === 0 ? (
        <div className="text-center py-20 text-stone-300">
          <p className="text-5xl mb-3">⚖</p>
          <p className="text-sm font-mono">No cases found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => <CaseCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}
