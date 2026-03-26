import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from app.core.database import Base, get_db
from app.main import app
import os
from dotenv import load_dotenv

load_dotenv(".env.test", override=True)

TEST_DATABASE_URL = os.getenv("DATABASE_URL")

# NullPool avoids connection reuse issues across async tests
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
    """Each test gets a real session that is rolled back after."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

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


# A few things worth noting here:
# - `scope="session"` on `setup_db` means tables are created once per pytest run, not per test
# - Each test gets its own session that **rolls back** after — so tests don't bleed into each other
# - The `dependency_overrides` swaps out the real DB for the test session cleanly



# You'll also need to update `requirements.txt` — add this if it's not there:

# pytest-asyncio==0.26.0  # already there ✓
# python-dotenv==1.1.0    # already there ✓