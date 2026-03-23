// ─────────────────────────────────────────────
//  PH-FC-2028 · Public Feed page
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { claimsApi, verdictsApi, type Claim, type Verdict } from "../services/api";
import { VerdictBadge, SourceBadge, ConfidenceBar } from "../components/Badges";

interface FeedItem {
  claim: Claim;
  verdict?: Verdict;
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const claims = await claimsApi.list(page * PAGE_SIZE, PAGE_SIZE);
        const enriched = await Promise.all(
          claims.map(async (c) => {
            const verdicts = await verdictsApi.forClaim(c.id).catch(() => []);
            return { claim: c, verdict: verdicts[0] };
          })
        );
        setItems((prev) => (page === 0 ? enriched : [...prev, ...enriched]));
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const formatDate = (iso: string) =>
    new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.round((new Date(iso).getTime() - Date.now()) / 3600000),
      "hour"
    );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold tracking-tight">
          Fact-check feed
        </h2>
        <span className="text-[11px] font-mono text-stone-400">
          Live · {items.length} claims
        </span>
      </div>

      {items.map(({ claim, verdict }) => (
        <article
          key={claim.id}
          className="bg-white border border-stone-100 rounded-xl p-5 hover:border-stone-200 transition-colors"
        >
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <SourceBadge source={claim.source} />
            <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
              {claim.language}
            </span>
            <span className="text-[11px] text-stone-300 font-mono ml-auto">
              {formatDate(claim.created_at)}
            </span>
          </div>

          {/* Claim text */}
          <p className="text-sm text-stone-800 leading-relaxed mb-4">
            {claim.raw_text}
          </p>

          {/* Verdict row */}
          {verdict ? (
            <div className="flex items-center gap-3 flex-wrap">
              <VerdictBadge tag={verdict.tag} confidence={verdict.confidence} />
              <ConfidenceBar value={verdict.confidence} tag={verdict.tag} />
              {verdict.explanation && (
                <p className="text-[11px] text-stone-400 mt-1 w-full leading-relaxed">
                  {verdict.explanation}
                </p>
              )}
            </div>
          ) : (
            <VerdictBadge tag="pending" />
          )}

          {/* Source URL */}
          {claim.source_url && (
            <a
              href={claim.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-[10px] font-mono text-stone-400 hover:text-stone-600 underline underline-offset-2 truncate max-w-xs"
            >
              {claim.source_url}
            </a>
          )}
        </article>
      ))}

      {/* Load more */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="px-6 py-2.5 text-sm font-medium border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-colors"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      </div>
    </div>
  );
}
