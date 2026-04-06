"""
Pytest configuration and fixtures for GCA Admin Dashboard tests
"""
import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.db.database import Base, get_db, AsyncSessionLocal
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.base import User


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()

    yield loop

    try:
        loop.close()
    except:
        pass


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a test database session.
    """
    # Start transaction
    async with AsyncSessionLocal() as session:
        async with session.begin():
            yield session
            # Will rollback on fixture teardown


# ============================================================================
# User & Authentication Fixtures
# ============================================================================

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user in the database."""
    user = User(
        id=uuid4(),
        email="testuser@example.com",
        password_hash=hash_password("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_admin=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
async def test_non_admin_user(db_session: AsyncSession) -> User:
    """Create a test non-admin user in the database."""
    user = User(
        id=uuid4(),
        email="regularuser@example.com",
        password_hash=hash_password("testpassword123"),
        full_name="Regular User",
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest.fixture
async def test_project(db_session: AsyncSession, test_user: User):
    """Create a test project in the database."""
    from app.models.pillar import Project

    project = Project(
        id=uuid4(),
        gp_id=test_user.id,
        project_name="Test Project",
        project_slug="test-project",
        description="A test project",
        status="active",
        created_at=datetime.utcnow(),
    )
    db_session.add(project)
    await db_session.flush()
    return project


@pytest.fixture
def auth_token(test_user: User) -> str:
    """Generate a valid JWT token for the test admin user."""
    return create_access_token(data={"sub": str(test_user.id)})


@pytest.fixture
def non_admin_token(test_non_admin_user: User) -> str:
    """Generate a valid JWT token for the test non-admin user."""
    return create_access_token(data={"sub": str(test_non_admin_user.id)})


@pytest.fixture
def invalid_token() -> str:
    """Return an invalid JWT token."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid"


# ============================================================================
# FastAPI Client Fixtures
# ============================================================================

@pytest.fixture
def test_app(db_session: AsyncSession) -> FastAPI:
    """Create a test FastAPI app with database dependency overridden."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def sync_client(test_app: FastAPI) -> TestClient:
    """Synchronous test client for FastAPI."""
    return TestClient(test_app)


@pytest.fixture
def async_client(test_app: FastAPI) -> TestClient:
    """Alias for sync_client (all tests use sync TestClient)"""
    return TestClient(test_app)


# ============================================================================
# Request Header Fixtures
# ============================================================================

@pytest.fixture
def auth_headers(auth_token: str) -> dict:
    """Return authorization headers with admin token."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def non_admin_auth_headers(non_admin_token: str) -> dict:
    """Return authorization headers with non-admin token."""
    return {"Authorization": f"Bearer {non_admin_token}"}


@pytest.fixture
def invalid_auth_headers(invalid_token: str) -> dict:
    """Return authorization headers with invalid token."""
    return {"Authorization": f"Bearer {invalid_token}"}


# ============================================================================
# Markers
# ============================================================================

def pytest_configure(config):
    """Register custom pytest markers."""
    config.addinivalue_line("markers", "asyncio: mark test as async")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "unit: mark test as unit test")
