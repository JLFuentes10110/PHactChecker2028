// ─────────────────────────────────────────────
//  PH-FC-2028 · API Service
//  Maps to FastAPI routes in app/routers/
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Types (mirrors Pydantic schemas) ──────────

export type ClaimSource =
  | "twitter" | "facebook" | "youtube"
  | "tiktok"  | "news"    | "manual";

export type ClaimStatus =
  | "pending" | "processing" | "done" | "failed";

export type VerdictTag =
  | "true" | "mostly_true" | "misleading"
  | "false" | "unverifiable" | "credit_grab";

export interface Claim {
  id: string;
  raw_text: string;
  source: ClaimSource;
  source_url?: string;
  language: string;          // "tl" | "en" | "ceb" …
  status: ClaimStatus;
  created_at: string;
  updated_at?: string;
}

export interface ClaimCreate {
  raw_text: string;
  source?: ClaimSource;
  source_url?: string;
  language?: string;
}

export interface Verdict {
  id: string;
  claim_id: string;
  tag: VerdictTag;
  confidence: number;        // 0.0 – 1.0
  explanation?: string;
  sources?: string;          // JSON string of URLs
  reviewed_by?: string;
  created_at: string;
}

export interface VerdictCreate {
  claim_id: string;
  tag: VerdictTag;
  confidence: number;
  explanation?: string;
  sources?: string[];
  reviewed_by?: string;
}

// ── Helpers ────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Claims API ─────────────────────────────────

export const claimsApi = {
  /** POST /api/v1/claims */
  submit: (payload: ClaimCreate) =>
    request<Claim>("/api/v1/claims/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /api/v1/claims */
  list: (skip = 0, limit = 20) =>
    request<Claim[]>(`/api/v1/claims/?skip=${skip}&limit=${limit}`),

  /** GET /api/v1/claims/{id} */
  get: (id: string) =>
    request<Claim>(`/api/v1/claims/${id}`),
};

// ── Verdicts API ───────────────────────────────

export const verdictsApi = {
  /** POST /api/v1/verdicts */
  create: (payload: VerdictCreate) =>
    request<Verdict>("/api/v1/verdicts/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /api/v1/verdicts/claim/{claim_id} */
  forClaim: (claimId: string) =>
    request<Verdict[]>(`/api/v1/verdicts/claim/${claimId}`),
};

// ── Health ─────────────────────────────────────

export const healthApi = {
  check: () => request<{ status: string }>("/health"),
};
