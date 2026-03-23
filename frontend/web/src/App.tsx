// ─────────────────────────────────────────────
//  PH-FC-2028 · App root + sidebar layout
// ─────────────────────────────────────────────
import { useState } from "react";
import './index.css';
import DashboardPage from "./pages/DashboardPage.tsx";
import FeedPage      from "./pages/FeedPage.tsx";
import SearchPage    from "./pages/SearchPage.tsx";
import AdminPage     from "./pages/AdminPage.tsx";
import SubmitPage    from "./pages/SubmitPage.tsx";

type Page = "dashboard" | "feed" | "search" | "admin" | "submit";

interface NavItem {
  id: Page;
  label: string;
  section?: string;
  icon: string;
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard",     icon: "▦" },
  { id: "feed",      label: "Public feed",   icon: "◈" },
  { id: "search",    label: "Claim search",  icon: "○" },
  { id: "admin",     label: "Moderation",    icon: "≡", section: "Admin" },
  { id: "submit",    label: "Submit claim",  icon: "+", section: "Admin" },
];

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Overview",
  feed:      "Public fact-check feed",
  search:    "Claim search",
  admin:     "Moderation panel",
  submit:    "Submit a claim",
};

export default function App() {
  const [current, setCurrent] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (current) {
      case "dashboard": return <DashboardPage />;
      case "feed":      return <FeedPage />;
      case "search":    return <SearchPage />;
      case "admin":     return <AdminPage />;
      case "submit":    return <SubmitPage />;
    }
  };

const grouped = NAV.reduce< Array<NavItem | { divider: string }> >((acc, item) => {
    if (item.section && (acc.length === 0 || (acc[acc.length - 1] as NavItem).section !== item.section)) {
      acc.push({ divider: item.section });
    }
    acc.push(item);
    return acc;
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* ── Sidebar ── */}
      <aside className="w-52 flex-shrink-0 bg-[#0f0f0d] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/5">
          <p className="text-[10px] font-mono text-stone-500 tracking-widest uppercase mb-1">ph-fc</p>
          <p className="font-display text-white text-base font-bold tracking-tight">
            TamaKaya<span className="text-red-500">'28</span>
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {grouped.map((item, i) => {
            if ("divider" in item) {
              return (
                <p key={i} className="px-4 pt-4 pb-1 text-[9px] font-mono uppercase tracking-widest text-stone-600">
                  {item.divider}
                </p>
              );
            }
            const navItem = item as NavItem;
            const active = current === navItem.id;
            return (
              <button
                key={navItem.id}
                onClick={() => setCurrent(navItem.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors border-l-2 ${
                  active
                    ? "text-white bg-white/5 border-red-500"
                    : "text-stone-500 border-transparent hover:text-stone-300 hover:bg-white/3"
                }`}
              >
                <span className="text-sm w-4 text-center">{navItem.icon}</span>
                {navItem.label}
              </button>
            );
          })}
        </nav>

        {/* API status */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[10px] font-mono text-stone-500">API live · v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-stone-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <h1 className="font-display text-[15px] font-bold tracking-tight text-stone-900">
            {PAGE_TITLES[current]}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-2 py-1 rounded">
              Phase 1 MVP
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-stone-50">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
