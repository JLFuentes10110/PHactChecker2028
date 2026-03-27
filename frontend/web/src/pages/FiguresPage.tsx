// ─────────────────────────────────────────────
//  PH-FC-2028 · Public Figures Registry
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import {
  figuresApi, casesApi,
  type PublicFigureListItem, type PublicFigure,
  type PublicFigureCreate, type FigurePosition,
  type LegalCase, type LegalCaseCreate,
  type CaseType, type CaseStatus, type CourtBody,
} from "../services/api";

// ── Constants ─────────────────────────────────────────────────────────────

const POSITIONS: FigurePosition[] = [
  "president","vice_president","senator","representative",
  "governor","mayor","vice_governor","vice_mayor",
  "board_member","councilor","cabinet_secretary",
  "undersecretary","bureau_director","appointee","other",
];

const CASE_TYPES: CaseType[] = [
  "criminal","administrative","sandiganbayan",
  "comelec_disqualification","ombudsman","civil",
];

const CASE_STATUSES: CaseStatus[] = [
  "filed","pending","on_trial","on_appeal",
  "dismissed","acquitted","convicted","disqualified","reinstated","unknown",
];

const COURT_BODIES: CourtBody[] = [
  "regional_trial_court","metropolitan_trial_court","sandiganbayan",
  "supreme_court","court_of_appeals","comelec","ombudsman",
  "department_of_justice","civil_service_commission","other",
];

const STATUS_STYLES: Record<CaseStatus, string> = {
  filed:         "bg-blue-50   text-blue-800   border-blue-200",
  pending:       "bg-amber-50  text-amber-800  border-amber-200",
  on_trial:      "bg-orange-50 text-orange-800 border-orange-200",
  on_appeal:     "bg-purple-50 text-purple-800 border-purple-200",
  dismissed:     "bg-stone-100 text-stone-500  border-stone-200",
  acquitted:     "bg-green-50  text-green-800  border-green-200",
  convicted:     "bg-red-50    text-red-900    border-red-300",
  disqualified:  "bg-red-100   text-red-900    border-red-300",
  reinstated:    "bg-teal-50   text-teal-800   border-teal-200",
  unknown:       "bg-stone-50  text-stone-400  border-stone-100",
};

const TYPE_LABELS: Record<CaseType, string> = {
  criminal:               "Criminal",
  administrative:         "Administrative",
  sandiganbayan:          "Sandiganbayan",
  comelec_disqualification: "COMELEC Disq.",
  ombudsman:              "Ombudsman",
  civil:                  "Civil",
};

function fmt(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sub-components ────────────────────────────────────────────────────────

function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${STATUS_STYLES[status]}`}>
      {fmt(status)}
    </span>
  );
}

function CaseTypePill({ type }: { type: CaseType }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
      {TYPE_LABELS[type]}
    </span>
  );
}

// ── Add Figure Modal ──────────────────────────────────────────────────────

function AddFigureModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<PublicFigureCreate>({
    full_name: "", alias: "", position: "other",
    party: "", region: "", province: "", bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof PublicFigureCreate, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await figuresApi.create(form);
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <h3 className="font-display font-bold text-base mb-5">Add public figure</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Full name *</label>
              <input className="input-sm" value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)} placeholder="Juan dela Cruz" />
            </div>
            <div>
              <label className="label-xs">Known alias</label>
              <input className="input-sm" value={form.alias ?? ""}
                onChange={(e) => set("alias", e.target.value)} placeholder='"Kiko"' />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Position</label>
              <select className="input-sm" value={form.position}
                onChange={(e) => set("position", e.target.value as FigurePosition)}>
                {POSITIONS.map((p) => <option key={p} value={p}>{fmt(p)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Party</label>
              <input className="input-sm" value={form.party ?? ""}
                onChange={(e) => set("party", e.target.value)} placeholder="PDP-Laban, NPC…" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Region</label>
              <input className="input-sm" value={form.region ?? ""}
                onChange={(e) => set("region", e.target.value)} placeholder="Region VII" />
            </div>
            <div>
              <label className="label-xs">Province</label>
              <input className="input-sm" value={form.province ?? ""}
                onChange={(e) => set("province", e.target.value)} placeholder="Cebu" />
            </div>
          </div>
          <div>
            <label className="label-xs">Bio</label>
            <textarea className="input-sm resize-none" rows={2} value={form.bio ?? ""}
              onChange={(e) => set("bio", e.target.value)} placeholder="Short background…" />
          </div>
        </div>
        {err && <p className="text-xs text-red-600 font-mono mt-3">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.full_name.trim()}
            className="flex-1 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-40">
            {saving ? "Saving…" : "Save figure →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Case Modal ────────────────────────────────────────────────────────

function AddCaseModal({
  figureId, figureName, onClose, onSaved,
}: { figureId: string; figureName: string; onClose: () => void; onSaved: () => void }) {
  const blank: LegalCaseCreate = {
    figure_id: figureId, case_type: "criminal", court_body: "other",
    status: "pending", title: "", charge: "", description: "",
    case_number: "", source_url: "", source_label: "", date_filed: "",
  };
  const [form, setForm] = useState<LegalCaseCreate>(blank);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof LegalCaseCreate, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isValidUrl = (u: string) =>
    u.trim().startsWith("http://") || u.trim().startsWith("https://");

  const save = async () => {
    if (!form.title.trim() || !isValidUrl(form.source_url ?? "")) return;
    setSaving(true);
    setErr(null);
    try {
      const payload = { ...form };
      if (!payload.date_filed) delete payload.date_filed;
      await casesApi.create(payload);
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="font-display font-bold text-base mb-1">Add legal case</h3>
        <p className="text-[11px] font-mono text-stone-400 mb-5">Subject: {figureName}</p>
        <div className="space-y-3">
          <div>
            <label className="label-xs">Case title *</label>
            <input className="input-sm" value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="People of the Philippines v. …" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Case type</label>
              <select className="input-sm" value={form.case_type}
                onChange={(e) => set("case_type", e.target.value as CaseType)}>
                {CASE_TYPES.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Court / body</label>
              <select className="input-sm" value={form.court_body}
                onChange={(e) => set("court_body", e.target.value as CourtBody)}>
                {COURT_BODIES.map((b) => <option key={b} value={b}>{fmt(b)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Status</label>
              <select className="input-sm" value={form.status}
                onChange={(e) => set("status", e.target.value as CaseStatus)}>
                {CASE_STATUSES.map((s) => <option key={s} value={s}>{fmt(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="label-xs">Case number</label>
              <input className="input-sm" value={form.case_number ?? ""}
                onChange={(e) => set("case_number", e.target.value)} placeholder="SB-21-CRM-0456" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Charge</label>
              <input className="input-sm" value={form.charge ?? ""}
                onChange={(e) => set("charge", e.target.value)} placeholder="Plunder, Graft…" />
            </div>
            <div>
              <label className="label-xs">Date filed</label>
              <input className="input-sm" type="date" value={form.date_filed ?? ""}
                onChange={(e) => set("date_filed", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label-xs">Description</label>
            <textarea className="input-sm resize-none" rows={2} value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)} placeholder="Brief summary…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Source label</label>
              <input className="input-sm" value={form.source_label ?? ""}
                onChange={(e) => set("source_label", e.target.value)} placeholder="Sandiganbayan records" />
            </div>
            <div>
              <label className="label-xs">
                Source URL <span className="text-red-400 normal-case">* required</span>
              </label>
              <input
                className={`input-sm ${
                  form.source_url && !isValidUrl(form.source_url)
                    ? "border-red-300 focus:border-red-400"
                    : ""
                }`}
                value={form.source_url ?? ""}
                onChange={(e) => set("source_url", e.target.value)}
                placeholder="https://sandiganbayan.judiciary.gov.ph/…" />
              <p className="text-[10px] font-mono text-stone-400 mt-1">
                Must link to an official government or court source.
              </p>
            </div>
          </div>
        </div>
        {err && <p className="text-xs text-red-600 font-mono mt-3">{err}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.title.trim() || !isValidUrl(form.source_url ?? "")}
            className="flex-1 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-40">
            {saving ? "Saving…" : "Add case →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Figure Detail Drawer ──────────────────────────────────────────────────

function FigureDrawer({
  figureId, onClose, onCaseAdded,
}: { figureId: string; onClose: () => void; onCaseAdded: () => void }) {
  const [figure, setFigure] = useState<PublicFigure | null>(null);
  const [addCase, setAddCase] = useState(false);

  useEffect(() => {
    figuresApi.get(figureId).then(setFigure);
  }, [figureId]);

  const refresh = () => figuresApi.get(figureId).then(setFigure);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-base">
            {figure?.full_name ?? "Loading…"}
            {figure?.alias && (
              <span className="ml-2 text-sm font-normal text-stone-400">"{figure.alias}"</span>
            )}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
        </div>

        {figure && (
          <div className="flex-1 px-6 py-5 space-y-6">
            {/* Profile */}
            <div className="flex flex-wrap gap-2">
              <span className="tag-pill">{fmt(figure.position)}</span>
              {figure.party && <span className="tag-pill">{figure.party}</span>}
              {figure.region && <span className="tag-pill">{figure.region}</span>}
              {figure.province && <span className="tag-pill">{figure.province}</span>}
            </div>
            {figure.bio && (
              <p className="text-sm text-stone-600 leading-relaxed">{figure.bio}</p>
            )}

            {/* Cases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-mono uppercase tracking-widest text-stone-400">
                  Legal cases ({figure.cases.length})
                </p>
                <button
                  onClick={() => setAddCase(true)}
                  className="text-[10px] font-mono px-2.5 py-1 bg-stone-900 text-white rounded-md hover:bg-stone-700">
                  + Add case
                </button>
              </div>

              {figure.cases.length === 0 ? (
                <p className="text-xs text-stone-300 font-mono py-4 text-center">No cases on record</p>
              ) : (
                <div className="space-y-2">
                  {figure.cases.map((c) => (
                    <div key={c.id}
                      className="border border-stone-100 rounded-xl p-4 hover:border-stone-200 transition-colors">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CaseTypePill type={c.case_type as CaseType} />
                        <CaseStatusBadge status={c.status as CaseStatus} />
                      </div>
                      <p className="text-sm font-medium text-stone-800 mb-1">{c.title}</p>
                      {c.charge && (
                        <p className="text-[11px] text-stone-500 font-mono">Charge: {c.charge}</p>
                      )}
                      {c.date_filed && (
                        <p className="text-[10px] text-stone-300 font-mono mt-1">Filed: {c.date_filed}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {addCase && figure && (
        <AddCaseModal
          figureId={figure.id}
          figureName={figure.full_name}
          onClose={() => setAddCase(false)}
          onSaved={() => { refresh(); onCaseAdded(); }}
        />
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function FiguresPage() {
  const [figures, setFigures] = useState<PublicFigureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const data = await figuresApi.list(0, 100, query);
      setFigures(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q || undefined), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  const withCases = figures.filter((f) => f.case_count > 0);
  const noCases   = figures.filter((f) => f.case_count === 0);

  return (
    <>
      {/* Inline styles for utility classes used here */}
      <style>{`
        .label-xs { display:block; font-size:11px; font-family:monospace; text-transform:uppercase; letter-spacing:.05em; color:#a8a29e; margin-bottom:6px; }
        .input-sm  { width:100%; border:1px solid #e7e5e4; border-radius:8px; padding:8px 12px; font-size:13px; outline:none; }
        .input-sm:focus { border-color:#a8a29e; }
        .tag-pill  { display:inline-block; padding:2px 10px; border-radius:999px; background:#f5f5f4; border:1px solid #e7e5e4; font-size:11px; font-family:monospace; color:#57534e; }
      `}</style>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Public figures</h2>
            <p className="text-[11px] font-mono text-stone-400 mt-0.5">
              {figures.length} registered · {withCases.length} with active records
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="text-xs font-mono px-3 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors">
            + Add figure
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or alias…"
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400" />
        </div>

        {loading ? (
          <p className="text-sm text-stone-400 font-mono">Loading figures…</p>
        ) : figures.length === 0 ? (
          <div className="text-center py-20 text-stone-300">
            <p className="text-5xl mb-3">⚖</p>
            <p className="text-sm font-mono">No figures found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Figures with cases */}
            {withCases.length > 0 && (
              <section>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-3">
                  With case records
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {withCases.map((f) => (
                    <FigureCard key={f.id} figure={f} onClick={() => setSelected(f.id)} />
                  ))}
                </div>
              </section>
            )}
            {/* Figures without cases */}
            {noCases.length > 0 && (
              <section>
                <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 mb-3">
                  No cases on record
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {noCases.map((f) => (
                    <FigureCard key={f.id} figure={f} onClick={() => setSelected(f.id)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {selected && (
        <FigureDrawer
          figureId={selected}
          onClose={() => setSelected(null)}
          onCaseAdded={() => load(q || undefined)}
        />
      )}

      {showAdd && (
        <AddFigureModal
          onClose={() => setShowAdd(false)}
          onSaved={() => load(q || undefined)}
        />
      )}
    </>
  );
}

function FigureCard({
  figure, onClick,
}: { figure: PublicFigureListItem; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-left bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-300 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-stone-900 group-hover:text-stone-700">
            {figure.full_name}
          </p>
          {figure.alias && (
            <p className="text-[11px] text-stone-400 font-mono">"{figure.alias}"</p>
          )}
        </div>
        {figure.case_count > 0 && (
          <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-700 text-[10px] font-bold font-mono border border-red-200">
            {figure.case_count}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
          {fmt(figure.position)}
        </span>
        {figure.party && (
          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
            {figure.party}
          </span>
        )}
        {figure.region && (
          <span className="text-[10px] font-mono text-stone-400 px-1">
            {figure.region}
          </span>
        )}
      </div>
    </button>
  );
}
