import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv(".env.test", override=True)
os.environ["TESTING"] = "1"

from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.getenv("DATABASE_URL")

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture()
async def db_session():
    """
    Each test gets its own connection with a savepoint.
    The router can commit freely (hits the savepoint, not the real transaction).
    After the test, everything rolls back — no bleed between tests.
    """
    async with test_engine.connect() as conn:
        await conn.begin()                    # outer real transaction
        await conn.begin_nested()             # savepoint — router commits land here

        session = AsyncSession(conn, expire_on_commit=False)

        async def mock_commit():
            await conn.begin_nested()         # reset savepoint after each commit

        session.commit = mock_commit          # intercept commits

        yield session

        await session.close()
        await conn.rollback()                 # wipe everything after test

@pytest_asyncio.fixture()
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()