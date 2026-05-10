"""
Shared fixtures for HEIT backend test suite.

Tests are run against a real Postgres database (heit_test). Each test is in a transaction that gets rolled back on teardown so that
tests are isolated from each other and the heit_test database is left clean after each test.
"""

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import app
from app.models import (  # noqa: F401  (model modules are imported so that their tables get registered on Base.metadata)
    category,
    ticket,
    ticket_like,
    ticket_status_history,
    user,
)

# Tests default to a heit_test database on the same Postgres instance as the development database
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://heit_user:heit_password@postgres:5432/heit_test",
)


@pytest.fixture(scope="session")
def test_engine():
    """
    One Postgres engine is used for the whole test session, tables are created at the start and then dropped at the end.
    """
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    """
    This is an SQLAlchemy session for one test which is wrapped in a transaction that gets rolled back on teardown.

    The rollbacks are facilitated through the use of SAVEPOINTs which act as bookmarks that enable us to return back to them and even undo db.commit().
    """
    connection = test_engine.connect()
    outer_transaction = connection.begin()
    SessionLocal = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = SessionLocal()

    # Open a SAVEPOINT and reopen it whenever the application releases it via commit() so that the production code can call commit() while the outer transaction stays open for rollback at teardown
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session):
    """
    A FastAPI TestClient with get_db overridden to make endpoints use the test session -> the override is cleared after each test so it can't mix with the other tests.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def resident_token(client):
    """
    Register a new resident and return their JWT so that it can be used in tests where an authenticated request is needed.
    """
    register = client.post(
        "/auth/register",
        json={
            "full_name": "test resident",
            "email": "resident@test.ie",
            "password": "testpassword",
            "role": "resident",
            "address": "test address",
        },
    )
    assert register.status_code == 201, (
        f"resident_token fixture failed to register a user. "
        f"Status: {register.status_code}, Body: {register.json()}"
    )
    login = client.post(
        "/auth/login",
        json={"email": "resident@test.ie", "password": "testpassword"},
    )
    assert login.status_code == 200, (
        f"resident_token fixture failed to log in. "
        f"Status: {login.status_code}, Body: {login.json()}"
    )
    return login.json()["access_token"]
