"""
ApplyZen Backend Basic Tests
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.repositories.user_repository import user_repo


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["app"] == "ApplyZen"


@pytest.mark.asyncio
async def test_signup_and_login_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Clean up existing test user if present
        existing = await user_repo.get_by_email("testuser@applyzen.com")
        if existing:
            await user_repo.delete(existing["_id"])

        # 1. Signup
        signup_res = await ac.post("/api/v1/auth/signup", json={
            "email": "testuser@applyzen.com",
            "password": "SecretPassword123!",
            "full_name": "Test User"
        })
        assert signup_res.status_code == 200
        signup_data = signup_res.json()

        # Handle email verification flow
        if signup_data.get("status") == "pending_verification":
            user = await user_repo.get_by_email("testuser@applyzen.com")
            assert user is not None
            otp = user.get("verification_otp")

            # 2. Verify Email
            verify_res = await ac.post("/api/v1/auth/verify-email", json={
                "email": "testuser@applyzen.com",
                "otp": otp
            })
            assert verify_res.status_code == 200
            assert verify_res.json().get("success") is True

            # 3. Login
            login_res = await ac.post("/api/v1/auth/login", json={
                "email": "testuser@applyzen.com",
                "password": "SecretPassword123!"
            })
            assert login_res.status_code == 200
            token = login_res.json()["access_token"]
        else:
            token = signup_data["access_token"]

        assert token is not None

        # 4. Test authenticated me
        me_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "testuser@applyzen.com"

        # 5. Test process email into opportunity
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
