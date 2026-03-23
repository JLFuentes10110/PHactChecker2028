// ─────────────────────────────────────────────
//  PH-FC-2028 · Badge components
// ─────────────────────────────────────────────
import type { VerdictTag, ClaimSource, ClaimStatus } from "../services/api";

// ── Verdict chip ───────────────────────────────

const VERDICT_STYLES: Record<VerdictTag | "pending", string> = {
  true:          "bg-green-50  text-green-900  border-green-200",
  mostly_true:   "bg-lime-50   text-lime-900   border-lime-200",
  misleading:    "bg-amber-50  text-amber-900  border-amber-200",
  false:         "bg-red-50    text-red-900    border-red-200",
  unverifiable:  "bg-stone-100 text-stone-600  border-stone-200",
  credit_grab:   "bg-orange-50 text-orange-900 border-orange-200",
  pending:       "bg-stone-50  text-stone-400  border-stone-100",
};

const VERDICT_LABELS: Record<VerdictTag | "pending", string> = {
  true:         "True",
  mostly_true:  "Mostly true",
  misleading:   "Misleading",
  false:        "False",
  unverifiable: "Unverifiable",
  credit_grab:  "Credit grab",
  pending:      "Pending",
};

export function VerdictBadge({
  tag,
  confidence,
}: {
  tag: VerdictTag | "pending";
  confidence?: number;
}) {
  const cls = VERDICT_STYLES[tag] ?? VERDICT_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${cls}`}
    >
      {VERDICT_LABELS[tag]}
      {confidence != null && confidence > 0 && (
        <span className="opacity-60">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}

// ── Source badge ───────────────────────────────

const SOURCE_STYLES: Record<ClaimSource, string> = {
  facebook: "bg-blue-50   text-blue-800  border-blue-100",
  twitter:  "bg-sky-50    text-sky-800   border-sky-100",
  tiktok:   "bg-pink-50   text-pink-800  border-pink-100",
  youtube:  "bg-red-50    text-red-800   border-red-100",
  news:     "bg-stone-100 text-stone-700 border-stone-200",
  manual:   "bg-violet-50 text-violet-800 border-violet-100",
};

export function SourceBadge({ source }: { source: ClaimSource }) {
  const cls = SOURCE_STYLES[source] ?? SOURCE_STYLES.manual;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium border capitalize ${cls}`}
    >
      {source}
    </span>
  );
}

// ── Status badge ───────────────────────────────

const STATUS_STYLES: Record<ClaimStatus, string> = {
  pending:    "bg-stone-100 text-stone-500",
  processing: "bg-amber-50  text-amber-700",
  done:       "bg-green-50  text-green-800",
  failed:     "bg-red-50    text-red-700",
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ── Confidence bar ─────────────────────────────

export function ConfidenceBar({
  value,
  tag,
}: {
  value: number;
  tag: VerdictTag;
}) {
  const COLOR: Record<VerdictTag, string> = {
    true:         "#639922",
    mostly_true:  "#97C459",
    misleading:   "#BA7517",
    false:        "#E24B4A",
    unverifiable: "#B4B2A9",
    credit_grab:  "#D85A30",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.round(value * 100)}%`, background: COLOR[tag] }}
        />
      </div>
      <span className="text-[10px] font-mono text-stone-400">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
