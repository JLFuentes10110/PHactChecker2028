from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import health, claims, verdicts

# Temporary debug — remove after confirming
print(">>> DATABASE_URL:", settings.database_url)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Semi-automated multilingual fact-checking platform for the 2028 Philippine Elections.",
    docs_url="/docs",
    redoc_url="/redoc",
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
