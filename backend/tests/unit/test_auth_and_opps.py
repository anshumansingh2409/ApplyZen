"""
ApplyZen Backend Basic Tests
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "ApplyZen"


@pytest.mark.asyncio
async def test_signup_and_login_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        signup_res = await ac.post("/api/v1/auth/signup", json={
            "email": "testuser@applyzen.com",
            "password": "SecretPassword123!",
            "full_name": "Test User"
        })
        assert signup_res.status_code == 200
        signup_data = signup_res.json()
        assert "access_token" in signup_data
        token = signup_data["access_token"]

        # Test authenticated me
        me_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "testuser@applyzen.com"

        # Test process email into opportunity
        opp_res = await ac.post(
            "/api/v1/opportunities/process-email",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "email_text": "Hiring at TechCorp for Senior Backend Engineer. Requirements: Python, FastAPI. Deadline: Next week.",
                "source_email": "jobs@techcorp.com"
            }
        )
        assert opp_res.status_code == 200
        assert "opportunity_id" in opp_res.json()
