// ─────────────────────────────────────────────
//  PH-FC-2028 · Submit Claim page
//  Wires directly to POST /api/v1/claims
// ─────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { claimsApi, verdictsApi, type ClaimCreate, type ClaimSource, type ClaimStatus, type VerdictTag } from "../services/api";
import { StatusBadge, VerdictBadge } from "../components/Badges";

const SOURCES: ClaimSource[] = ["manual", "facebook", "twitter", "tiktok", "youtube", "news"];
const LANGS = [
  { value: "tl",  label: "Tagalog" },
  { value: "en",  label: "English" },
  { value: "ceb", label: "Cebuano" },
  { value: "ilo", label: "Ilocano" },
];

export default function SubmitPage() {
  const [form, setForm] = useState<ClaimCreate>({
    raw_text: "",
    source: "manual",
    language: "tl",
    source_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);
  const [claim, setClaim] = useState<any>(null);
  const [verdict, setVerdict] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null); 

  const set = (k: keyof ClaimCreate, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.raw_text.trim()) return;
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const claim = await claimsApi.submit(form);
      setResult({ id: claim.id, status: claim.status });
      setForm({ raw_text: "", source: "manual", language: "tl", source_url: "" });
      // Start polling
      pollClaim(claim.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }; 

  const pollClaim = useCallback(async (id: string) => {
    try {
      const cl = await claimsApi.get(id);
      setClaim(cl);
      const v = await verdictsApi.forClaim(id);
      setVerdict(v[0] || null);
      if (cl.status === "done") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (e) {
      console.error("Poll error:", e);
    }
  }, []);

  useEffect(() => {
    if (result?.id) {
      pollClaim(result.id);
      pollRef.current = setInterval(() => pollClaim(result.id!), 3000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [result?.id, pollClaim]);

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold tracking-tight">Submit a claim</h2>
        <p className="text-sm text-stone-400 mt-1">
          Calls{" "}
          <code className="text-[11px] bg-stone-100 px-1.5 py-0.5 rounded font-mono">
            POST /api/v1/claims
          </code>
        </p>
      </div>

      <div className="space-y-5"> 
        {/* Text */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
            Claim text *
          </label>
          <textarea
            value={form.raw_text}
            onChange={(e) => set("raw_text", e.target.value)}
            rows={4}
            placeholder="Paste claim text in Filipino or English…"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-stone-400 resize-none"
          />
          <p className="text-[10px] font-mono text-stone-300 mt-1">
            {form.raw_text.trim().length} chars
          </p>
        </div>

        {/* Source + Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
              Source platform
            </label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400 capitalize"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
              Language
            </label>
            <select
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400"
            >
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>{l.label} ({l.value})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-stone-400 mb-1.5">
            Source URL{" "}
            <span className="normal-case text-stone-300">(optional)</span>
          </label>
          <input
            type="url"
            value={form.source_url}
            onChange={(e) => set("source_url", e.target.value)}
            placeholder="https://facebook.com/post/…"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={submitting || !form.raw_text.trim()}
          className="w-full py-3 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-40 transition-colors"
        >
          {submitting ? "Submitting…" : "Submit claim →"}
        </button>

        {/* Success */}
        {result && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-2">
            <p className="text-xs font-mono text-stone-600 mb-1">Tracking live...</p>
            <StatusBadge status={claim?.status || result.status as ClaimStatus} />
            {verdict && <VerdictBadge tag={verdict.tag} confidence={verdict.confidence} />}
            <p className="text-[11px] font-mono text-stone-500">
              id: {result.id}
            </p>
            <button 
              onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setResult(null); setClaim(null); setVerdict(null); }}
              className="text-xs text-stone-400 underline hover:text-stone-600"
            >
              Stop tracking
            </button>
          </div>
        )} 

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-mono text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
