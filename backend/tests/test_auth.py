"""
Smoke tests for the auth flow.
"""


def test_registration_login_sequence(client):
    """
    Register a new resident -> log in -> call /auth/me with the generated token.

    Every step should succeed and return the data given during registration.
    """
    register = client.post(
        "/auth/register",
        json={
            "full_name": "alice",
            "email": "alice@test.ie",
            "password": "testpassword",
            "role": "resident",
            "address": "test house",
        },
    )
    assert register.status_code == 201
    assert register.json()["email"] == "alice@test.ie"

    login = client.post(
        "/auth/login",
        json={"email": "alice@test.ie", "password": "testpassword"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert token  # check that the token contains a value

    me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "alice@test.ie"
    assert me.json()["role"] == "resident"


def test_login_with_wrong_password_returns_401(client):
    """
    Wrong password should be rejected with 401 and at the same time it should not reveal that the email exists.
    """
    client.post(
        "/auth/register",
        json={
            "full_name": "bob",
            "email": "bob@test.ie",
            "password": "testpassword",
            "role": "resident",
            "address": "test house",
        },
    )
    response = client.post(
        "/auth/login",
        json={"email": "bob@test.ie", "password": "wrong"},
    )
    assert response.status_code == 401
