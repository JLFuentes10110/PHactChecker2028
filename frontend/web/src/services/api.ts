// ─────────────────────────────────────────────
//  PH-FC-2028 · API service layer
// ─────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const V1 = `${BASE}/api/v1`;

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export type VerdictTag =
  | "true" | "mostly_true" | "misleading"
  | "false" | "unverifiable" | "credit_grab";

export type ClaimSource =
  | "facebook" | "twitter" | "tiktok" | "youtube" | "news" | "manual";

export type ClaimStatus = "pending" | "processing" | "done" | "failed";

export type CaseType =
  | "criminal" | "administrative" | "sandiganbayan"
  | "comelec_disqualification" | "ombudsman" | "civil";

export type CaseStatus =
  | "filed" | "pending" | "on_trial" | "on_appeal"
  | "dismissed" | "acquitted" | "convicted"
  | "disqualified" | "reinstated" | "unknown";

export type CourtBody =
  | "regional_trial_court" | "metropolitan_trial_court"
  | "sandiganbayan" | "supreme_court" | "court_of_appeals"
  | "comelec" | "ombudsman" | "department_of_justice"
  | "civil_service_commission" | "other";

export type FigurePosition =
  | "president" | "vice_president" | "senator" | "representative"
  | "governor" | "mayor" | "vice_governor" | "vice_mayor"
  | "board_member" | "councilor" | "cabinet_secretary"
  | "undersecretary" | "bureau_director" | "appointee" | "other";

export interface Verdict {
  id: string;
  claim_id: string;
  tag: VerdictTag;
  confidence: number;
  explanation?: string;
  sources?: string[];
  bias_note?: string;
  reviewed_by?: string;
  created_at: string;
  cited_cases?: LegalCase[];
}

export interface Claim {
  id: string;
  raw_text: string;
  source: ClaimSource;
  source_url?: string;
  language: string;
  status: ClaimStatus;
  created_at: string;
  updated_at?: string;
  verdict?: Verdict;
}

export interface ClaimCreate {
  raw_text: string;
  source: ClaimSource;
  language: string;
  source_url?: string;
}

export interface LegalCaseSummary {
  id: string;
  case_type: CaseType;
  court_body: CourtBody;
  status: CaseStatus;
  title: string;
  charge?: string;
  date_filed?: string;
}

export interface PublicFigure {
  id: string;
  full_name: string;
  alias?: string;
  position: FigurePosition;
  party?: string;
  region?: string;
  province?: string;
  photo_url?: string;
  bio?: string;
  cases: LegalCaseSummary[];
  created_at: string;
  updated_at?: string;
}

export interface PublicFigureListItem {
  id: string;
  full_name: string;
  alias?: string;
  position: FigurePosition;
  party?: string;
  region?: string;
  case_count: number;
}

export interface PublicFigureCreate {
  full_name: string;
  alias?: string;
  position: FigurePosition;
  party?: string;
  region?: string;
  province?: string;
  photo_url?: string;
  bio?: string;
}

export interface LegalCase {
  id: string;
  figure_id: string;
  case_number?: string;
  case_type: CaseType;
  court_body: CourtBody;
  status: CaseStatus;
  title: string;
  description?: string;
  charge?: string;
  penalty?: string;
  date_filed?: string;
  date_resolved?: string;
  source_url?: string;
  source_label?: string;
  added_by?: string;
  subject?: {
    id: string; full_name: string; alias?: string; position: string; party?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface LegalCaseCreate {
  figure_id: string;
  case_number?: string;
  case_type: CaseType;
  court_body: CourtBody;
  status: CaseStatus;
  title: string;
  description?: string;
  charge?: string;
  penalty?: string;
  date_filed?: string;
  date_resolved?: string;
  source_url?: string;
  source_label?: string;
}

// ── API clients ────────────────────────────────────────────────────────────

export const claimsApi = {
  submit: (payload: ClaimCreate) =>
    req<Claim>(`${V1}/claims/`, { method: "POST", body: JSON.stringify(payload) }),
  list: (skip = 0, limit = 50) =>
    req<Claim[]>(`${V1}/claims/?skip=${skip}&limit=${limit}`),
  get: (id: string) => req<Claim>(`${V1}/claims/${id}`),
  search: (q: string) => req<Claim[]>(`${V1}/claims/search?q=${encodeURIComponent(q)}`),
};

export const verdictsApi = {
  create: (payload: Partial<Verdict> & { claim_id: string; tag: VerdictTag; confidence: number }) =>
    req<Verdict>(`${V1}/verdicts/`, { method: "POST", body: JSON.stringify(payload) }),
  forClaim: (claimId: string) =>
    req<Verdict[]>(`${V1}/verdicts/claim/${claimId}`),
};

export const figuresApi = {
  create: (payload: PublicFigureCreate) =>
    req<PublicFigure>(`${V1}/figures/`, { method: "POST", body: JSON.stringify(payload) }),
  list: (skip = 0, limit = 50, q?: string) =>
    req<PublicFigureListItem[]>(`${V1}/figures/?skip=${skip}&limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
  get: (id: string) => req<PublicFigure>(`${V1}/figures/${id}`),
  update: (id: string, payload: Partial<PublicFigureCreate>) =>
    req<PublicFigure>(`${V1}/figures/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id: string) =>
    fetch(`${V1}/figures/${id}`, { method: "DELETE" }),
};

export const casesApi = {
  create: (payload: LegalCaseCreate) =>
    req<LegalCase>(`${V1}/cases/`, { method: "POST", body: JSON.stringify(payload) }),
  list: (params?: { figure_id?: string; case_type?: CaseType; status?: CaseStatus; q?: string; skip?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (params?.figure_id) p.set("figure_id", params.figure_id);
    if (params?.case_type) p.set("case_type", params.case_type);
    if (params?.status)    p.set("status", params.status);
    if (params?.q)         p.set("q", params.q);
    if (params?.skip != null) p.set("skip", String(params.skip));
    if (params?.limit != null) p.set("limit", String(params.limit));
    return req<LegalCase[]>(`${V1}/cases/?${p}`);
  },
  get: (id: string) => req<LegalCase>(`${V1}/cases/${id}`),
  update: (id: string, payload: Partial<LegalCaseCreate>) =>
    req<LegalCase>(`${V1}/cases/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  delete: (id: string) => fetch(`${V1}/cases/${id}`, { method: "DELETE" }),
  link: (verdict_id: string, case_id: string) =>
    req(`${V1}/cases/link`, { method: "POST", body: JSON.stringify({ verdict_id, case_id }) }),
  unlink: (verdict_id: string, case_id: string) =>
    req(`${V1}/cases/link`, { method: "DELETE", body: JSON.stringify({ verdict_id, case_id }) }),
};
