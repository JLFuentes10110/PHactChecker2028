import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from unittest.mock import AsyncMock, patch
from app.core.database import Base, get_db
from app.main import app
import os
from dotenv import load_dotenv

load_dotenv(".env.test", override=True)

TEST_DATABASE_URL = os.getenv("DATABASE_URL")

def make_engine():
    return create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)

def pytest_configure(config):
    async def _setup():
        engine = make_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()
    asyncio.run(_setup())

def pytest_unconfigure(config):
    async def _teardown():
        engine = make_engine()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
    asyncio.run(_teardown())

@pytest_asyncio.fixture()
async def client():
    app.state.groq = AsyncMock()
    app.state.tavily = AsyncMock()

    engine = make_engine()
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # ✅ KEY FIX: mock the extractor so background task is instant and never opens a DB session
    with patch("app.routers.claims.extract_and_verify_claim", new_callable=AsyncMock):
        async with session_factory() as session:
            async def override_get_db():
                yield session

            app.dependency_overrides[get_db] = override_get_db

            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                yield ac

            app.dependency_overrides.clear()

            async with engine.begin() as conn:
                await conn.execute(text("TRUNCATE TABLE verdicts, claims RESTART IDENTITY CASCADE"))

    await engine.dispose()