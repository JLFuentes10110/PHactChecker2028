# PH-FC-2028 — Fact-Check & Credibility Tagger

A semi-automated, multilingual fact-checking platform for the 2028 Philippine Elections.

## Quick Start (Windows)

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
copy .env.example .env
# Edit .env with your actual values

# 4. Run the API
uvicorn app.main:app --reload
```

## API Docs
Visit http://localhost:8000/docs after running.

## Project Structure
```
ph-fc-2028/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   └── database.py      # Async SQLAlchemy engine & session
│   ├── routers/
│   │   ├── health.py        # GET /health
│   │   ├── claims.py        # POST/GET /api/v1/claims
│   │   └── verdicts.py      # POST/GET /api/v1/verdicts
│   ├── models/
│   │   ├── claim.py         # Claim SQLAlchemy model
│   │   └── verdict.py       # Verdict SQLAlchemy model
│   ├── schemas/
│   │   ├── claim.py         # Pydantic request/response schemas
│   │   └── verdict.py
│   └── services/
│       ├── claim_extractor.py  # NLP pipeline (stub → Phase 2)
│       ├── fact_checker.py     # RAG + LLM checker (stub → Phase 2)
│       └── scorer.py           # Verdict confidence scoring
└── tests/
    └── test_claims.py
```

## Roadmap
- **Phase 1 (now):** Core API scaffold, DB models, manual verdict submission
- **Phase 2:** NLP claim extraction (spaCy Tagalog + xlm-roberta)
- **Phase 3:** Groq LLaMA 3 RAG-based fact-checking
- **Phase 4:** Credit-grab detection engine
