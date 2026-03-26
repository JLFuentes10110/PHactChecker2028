import pytest
from httpx import AsyncClient

# --- Health Check ---

async def test_health(client: AsyncClient):
    response = await client.get("/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# --- POST /api/v1/claims ---

async def test_submit_claim_happy_path(client: AsyncClient):
    payload = {
        "raw_text": "Ang presidente ay nagbigay ng ayuda sa lahat ng Pilipino.",
        "source": "facebook",
        "language": "tl"
    }
    response = await client.post("/api/v1/claims/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["raw_text"] == payload["raw_text"]
    assert data["source"] == "facebook"
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data

async def test_submit_claim_english(client: AsyncClient):
    payload = {
        "raw_text": "The senator built 100 schools in Cebu.",
        "source": "twitter",
        "language": "en"
    }
    response = await client.post("/api/v1/claims/", json=payload)
    assert response.status_code == 201
    assert response.json()["language"] == "en"

async def test_submit_claim_invalid_source(client: AsyncClient):
    payload = {
        "raw_text": "Some claim here.",
        "source": "instagram",  # not a valid ClaimSource
        "language": "tl"
    }
    response = await client.post("/api/v1/claims/", json=payload)
    assert response.status_code == 422  # Unprocessable Entity

async def test_submit_claim_invalid_language(client: AsyncClient):
    payload = {
        "raw_text": "Some claim here.",
        "source": "manual",
        "language": "jp"  # not valid
    }
    response = await client.post("/api/v1/claims/", json=payload)
    assert response.status_code == 422

async def test_submit_claim_missing_text(client: AsyncClient):
    payload = {
        "source": "manual",
        "language": "tl"
        # raw_text is missing
    }
    response = await client.post("/api/v1/claims/", json=payload)
    assert response.status_code == 422


# --- GET /api/v1/claims/{id} ---

async def test_get_claim_by_id(client: AsyncClient):
    # First create one
    payload = {
        "raw_text": "Si Marcos ay nagpatupad ng bagong batas.",
        "source": "news",
        "language": "tl"
    }
    create_response = await client.post("/api/v1/claims/", json=payload)
    claim_id = create_response.json()["id"]

    # Now fetch it
    response = await client.get(f"/api/v1/claims/{claim_id}")
    assert response.status_code == 200
    assert response.json()["id"] == claim_id

async def test_get_claim_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/claims/{fake_id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Claim not found"


# --- GET /api/v1/claims/ ---

async def test_list_claims(client: AsyncClient):
    response = await client.get("/api/v1/claims/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

async def test_list_claims_pagination(client: AsyncClient):
    # Create 3 claims
    for i in range(3):
        await client.post("/api/v1/claims/", json={
            "raw_text": f"Test claim number {i}",
            "source": "manual",
            "language": "en"
        })

    # Fetch only 2
    response = await client.get("/api/v1/claims/?skip=0&limit=2")
    assert response.status_code == 200
    assert len(response.json()) <= 2