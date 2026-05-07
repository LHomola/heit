"""
Smoke test for the categories endpoint.
"""


def test_categories_endpoint_requires_auth(client):
    """
    Request to /categories without an Authorization header should be rejected -> the returned error should be 403 but could also be 401.
    """
    response = client.get("/categories/")
    assert response.status_code in (401, 403)


def test_categories_endpoint_returns_list_when_authenticated(client, resident_token):
    """
    Request to /categories with an Authorization header should result in the endpoint returning a JSON list (which will be empty since categories have not been seeded).
    """
    response = client.get(
        "/categories/",
        headers={"Authorization": f"Bearer {resident_token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
