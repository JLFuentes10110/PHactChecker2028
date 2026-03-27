"""
conftest.py — PHact-Checker 2028
---------------------------------
Per-test transaction rollback pattern:
  1. One engine for the whole session (module scope)
  2. Each test gets its own connection + SAVEPOINT
  3. On teardown we ROLLBACK — no TRUNCATE needed, no lock contention
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncConnection,
)
from sqlalchemy.pool import NullPool
from unittest.mock import AsyncMock, patch
from app.core.database import Base, get_db
from app.main import app
import os
from dotenv import load_dotenv

load_dotenv(".env.test", override=True)

TEST_DATABASE_URL = os.getenv("DATABASE_URL")

# ── Fix asyncio_default_fixture_loop_scope warning ──────────────────────────
# Tell pytest-asyncio to use a single event loop for the entire test session.
# Without this, each test function gets its own loop and fixtures shared across
# tests can deadlock when they try to reuse connections from a dead loop.

def pytest_configure(config):
    """Called early — create tables once before any test runs."""
    async def _bootstrap():
        engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    asyncio.run(_bootstrap())


def pytest_unconfigure(config):
    """Drop tables after the full suite finishes."""
    async def _teardown():
        engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()

    asyncio.run(_teardown())


# ── Shared engine (function-scoped is fine; NullPool = no real pooling) ─────

@pytest_asyncio.fixture()
async def client():
    """
    Provides an AsyncClient wired to a *per-test* rolled-back transaction.

    Pattern:
      connection → BEGIN → yield session (nested SAVEPOINT) → ROLLBACK

    This means every test starts with a clean slate without touching disk.
    """
    # Mock AI clients so no real HTTP calls go out
    app.state.groq = AsyncMock()
    app.state.tavily = AsyncMock()

    # Fresh engine per test (NullPool → no connection reuse across tests)
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)

    async with engine.connect() as conn:
        # Start an outer transaction that we'll roll back at the end
        await conn.begin()

        # Bind a session to this connection so all DB ops go through it
        session_factory = async_sessionmaker(
            bind=conn,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        async with session_factory() as session:
            # Override FastAPI's get_db to use our test session
            async def override_get_db():
                yield session

            app.dependency_overrides[get_db] = override_get_db

            # Patch the background task so it never spawns a real worker
            with patch(
                "app.routers.claims.extract_and_verify_claim",
                new_callable=AsyncMock,
            ):
                async with AsyncClient(
                    transport=ASGITransport(app=app),
                    base_url="http://test",
                ) as ac:
                    yield ac  # ← test runs here

            app.dependency_overrides.clear()

        # Roll back everything the test wrote — no TRUNCATE, no lock contention
        await conn.rollback()

    await engine.dispose()