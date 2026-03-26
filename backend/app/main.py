from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import health, claims, verdicts

# 1. Define the Lifespan logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This matches your .env.test where ENVIRONMENT=test
    if settings.ENVIRONMENT == "test":
        print(f"🛠️  LOCAL RUN: Syncing local database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    else:
        # This will trigger when ENVIRONMENT=development or production
        print(f"🚀 {settings.ENVIRONMENT.upper()} MODE: Skipping auto-sync.")
    
    yield
    
    # --- SHUTDOWN ---
    # Properly close the database engine connections
    await engine.dispose()

# 2. Initialize FastAPI with lifespan
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Semi-automated multilingual fact-checking platform for the 2028 Philippine Elections.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan, # Attach the lifespan context manager here
)

# CORS – allow all origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(claims.router, prefix="/api/v1")
app.include_router(verdicts.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name} API 🇵🇭"}