from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import AsyncGroq
from tavily import AsyncTavilyClient

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import health, claims, verdicts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init AI clients once, share via app.state
    app.state.groq = AsyncGroq(api_key=settings.GROQ_API_KEY)
    app.state.tavily = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)

    if settings.ENVIRONMENT == "test":
        print("🛠️  LOCAL RUN: Syncing local database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    else:
        print(f"🚀 {settings.ENVIRONMENT.upper()} MODE: Skipping auto-sync.")

    yield

    await engine.dispose()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Semi-automated multilingual fact-checking platform for the 2028 Philippine Elections.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(claims.router, prefix="/api/v1")
app.include_router(verdicts.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name} API 🇵🇭"}