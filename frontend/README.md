# PH-FC-2028 — Frontend

Frontend for the **TamaKaya '28** fact-checking platform.  
Connects to the FastAPI backend at `app/main.py`.

---

## Structure

```
ph-fc-2028-frontend/
├── web/                          # React + Vite + Tailwind (deploy to Vercel)
│   ├── src/
│   │   ├── services/api.ts       # Typed wrappers for all FastAPI endpoints
│   │   ├── components/
│   │   │   └── Badges.tsx        # VerdictBadge, SourceBadge, ConfidenceBar
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx # Metrics, verdict distribution, source chart
│   │   │   ├── FeedPage.tsx      # Paginated public fact-check feed
│   │   │   ├── SearchPage.tsx    # Search + filter by verdict & source
│   │   │   ├── AdminPage.tsx     # Moderation table + verdict override modal
│   │   │   └── SubmitPage.tsx    # Submit claim form → POST /api/v1/claims
│   │   └── App.tsx               # Sidebar shell + routing
│   ├── vite.config.ts            # Proxy /api → localhost:8000 in dev
│   ├── tailwind.config.js
│   └── package.json
│
└── mobile/                       # Flutter (deploy via Play Store / TestFlight)
    ├── lib/
    │   ├── main.dart             # App entry + bottom nav shell
    │   ├── services/
    │   │   └── api_service.dart  # Dart models + ApiService (mirrors Pydantic)
    │   ├── widgets/
    │   │   └── badges.dart       # VerdictChip, SourceBadge, ConfidenceBar
    │   └── screens/
    │       ├── feed_screen.dart
    │       ├── search_screen.dart
    │       ├── submit_screen.dart
    │       └── dashboard_screen.dart
    └── pubspec.yaml
```

---

## Web — Quick Start

```bash
cd web
npm install
cp .env.example .env          # set VITE_API_URL if not localhost
npm run dev                   # → http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:8000`  
(your FastAPI instance). No CORS config needed in dev.

### Deploy to Vercel

```bash
npm run build                 # outputs to dist/
# push to GitHub → Vercel auto-deploys from dist/
```

Set `VITE_API_URL` in Vercel environment variables to your Railway/Render/Fly.io backend URL.

---

## Mobile — Quick Start

```bash
cd mobile
# Download fonts from Google Fonts → place in assets/fonts/
# (Syne, DM Sans, DM Mono)
flutter pub get
flutter run                   # runs on emulator or device
```

**Android emulator**: API base URL defaults to `http://10.0.2.2:8000` (maps to host `localhost`).  
**Physical device**: Update `_base` in `lib/services/api_service.dart` to your local IP or deployed URL.

### Build for distribution

```bash
# Android APK (sideload / Play Store)
flutter build apk --release --dart-define=API_URL=https://your-api.railway.app

# iOS (TestFlight — requires macOS + Xcode)
flutter build ios --release --dart-define=API_URL=https://your-api.railway.app
```

---

## API endpoint mapping

| Frontend action          | FastAPI route                          |
|--------------------------|----------------------------------------|
| List claims feed         | `GET /api/v1/claims/?skip=&limit=`     |
| Get single claim         | `GET /api/v1/claims/{id}`              |
| Submit claim             | `POST /api/v1/claims/`                 |
| Get verdicts for claim   | `GET /api/v1/verdicts/claim/{id}`      |
| Create / override verdict| `POST /api/v1/verdicts/`               |
| Health check             | `GET /health`                          |

---

## Roadmap alignment

| Phase | Frontend work needed                                     |
|-------|----------------------------------------------------------|
| 1 ✅  | All pages wired, verdict override, claim submission      |
| 2     | Real-time status polling (claim `processing` → `done`)   |
| 3     | Display RAG sources, confidence breakdown per model      |
| 4     | Credit-grab detection badge + politician entity cards    |
