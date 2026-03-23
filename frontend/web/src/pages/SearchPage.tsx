// ─────────────────────────────────────────────
//  PH-FC-2028 · Claim Search page
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { claimsApi, verdictsApi, type Claim, type Verdict, type VerdictTag, type ClaimSource } from "../services/api";
import { VerdictBadge, SourceBadge, ConfidenceBar } from "../components/Badges";

const VERDICT_FILTERS: { label: string; value: VerdictTag | "all" }[] = [
  { label: "All",          value: "all" },
  { label: "False",        value: "false" },
  { label: "Misleading",   value: "misleading" },
  { label: "Credit grab",  value: "credit_grab" },
  { label: "True",         value: "true" },
  { label: "Mostly true",  value: "mostly_true" },
  { label: "Unverifiable", value: "unverifiable" },
];

const SOURCE_FILTERS: { label: string; value: ClaimSource | "all" }[] = [
  { label: "All sources", value: "all" },
  { label: "Facebook",    value: "facebook" },
  { label: "TikTok",      value: "tiktok" },
  { label: "Twitter",     value: "twitter" },
  { label: "YouTube",     value: "youtube" },
  { label: "News",        value: "news" },
];

interface SearchResult {
  claim: Claim;
  verdict?: Verdict;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<VerdictTag | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<ClaimSource | "all">("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const claims = await claimsApi.list(0, 100);

      // Client-side filter (Phase 2: move to backend query params)
      const filtered = claims.filter((c) => {
        const matchesQuery =
          !query || c.raw_text.toLowerCase().includes(query.toLowerCase());
        const matchesSource =
          sourceFilter === "all" || c.source === sourceFilter;
        return matchesQuery && matchesSource;
      });

      const enriched = await Promise.all(
        filtered.map(async (c) => {
          const verdicts = await verdictsApi.forClaim(c.id).catch(() => []);
          return { claim: c, verdict: verdicts[0] };
        })
      );

      // Verdict filter (client side until backend supports it)
      const final =
        verdictFilter === "all"
          ? enriched
          : enriched.filter((r) => r.verdict?.tag === verdictFilter);

      setResults(final);
    } finally {
      setLoading(false);
    }
  }, [query, verdictFilter, sourceFilter]);

  // Debounce search on query change
  useEffect(() => {
    const t = setTimeout(search, 400);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="p-6">
      {/* Search bar */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search claims in Filipino or English…"
          className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 font-body bg-white"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        <div className="flex gap-2 flex-wrap">
          {VERDICT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setVerdictFilter(f.value as VerdictTag | "all")}
              className={`text-[11px] font-mono px-3 py-1 rounded-md border transition-colors ${
                verdictFilter === f.value
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {SOURCE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSourceFilter(f.value as ClaimSource | "all")}
              className={`text-[11px] font-mono px-3 py-1 rounded-md border transition-colors ${
                sourceFilter === f.value
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[11px] font-mono text-stone-400 mb-4">
        {loading ? "Searching…" : `${results.length} result${results.length !== 1 ? "s" : ""}`}
      </p>

      {/* Results */}
      <div className="space-y-3">
        {results.map(({ claim, verdict }) => (
          <div
            key={claim.id}
            className="bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-200 transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <SourceBadge source={claim.source} />
              <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                {claim.language}
              </span>
              <code className="text-[10px] text-stone-300 font-mono ml-auto">
                #{claim.id.slice(0, 8)}
              </code>
            </div>
            <p className="text-sm text-stone-800 leading-relaxed mb-3">{claim.raw_text}</p>
            <div className="flex items-center gap-3">
              {verdict ? (
                <>
                  <VerdictBadge tag={verdict.tag} />
                  <ConfidenceBar value={verdict.confidence} tag={verdict.tag} />
                </>
              ) : (
                <VerdictBadge tag="pending" />
              )}
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div className="text-center py-16 text-stone-300">
            <p className="text-4xl mb-3">○</p>
            <p className="text-sm font-mono">No claims found</p>
          </div>
        )}
      </div>
    </div>
  );
}
