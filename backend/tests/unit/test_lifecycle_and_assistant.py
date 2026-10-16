"""
ApplyZen Additional Lifecycle, CAPTCHA, and Assistant Tests
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_captcha_and_assistant_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Signup
        signup_res = await ac.post("/api/v1/auth/signup", json={
            "email": "lifecycle@applyzen.com",
            "password": "Password12345!",
            "full_name": "Lifecycle Candidate"
        })
        token = signup_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Process Email -> creates opportunity and application
        opp_res = await ac.post(
            "/api/v1/opportunities/process-email",
            headers=headers,
            json={
                "email_text": "Amazon is hiring Software Development Engineers. Required: Python, React. Batch 2025. Min CGPA 8.0.",
                "source_email": "recruiting@amazon.com"
            }
        )
        opp_data = opp_res.json()
        assert opp_data["status"] == "application_created"
        app_id = opp_data["application_id"]

        # Get application detail
        app_res = await ac.get(f"/api/v1/applications/{app_id}", headers=headers)
        assert app_res.status_code == 200
        app_details = app_res.json()
        assert app_details["company"] == "Amazon"
        assert len(app_details["form_fields"]) > 0

        # Trigger CAPTCHA simulation
        cap_res = await ac.post(f"/api/v1/applications/{app_id}/trigger-captcha", headers=headers)
        assert cap_res.status_code == 200
        assert cap_res.json()["status"] == "paused_for_human_captcha"

        # Check status is now ACTION_REQUIRED
        app_res2 = await ac.get(f"/api/v1/applications/{app_id}", headers=headers)
        assert app_res2.json()["status"] == "ACTION_REQUIRED"

        # Resolve CAPTCHA
        res_cap = await ac.post(f"/api/v1/applications/{app_id}/resolve-captcha", headers=headers)
        assert res_cap.status_code == 200

        # Review and Submit application
        review_res = await ac.post(
            f"/api/v1/applications/{app_id}/review",
            headers=headers,
            json={
                "updated_fields": app_details["form_fields"],
                "approved": True
            }
        )
        assert review_res.status_code == 200
        assert review_res.json()["status"] == "SUBMITTED"

        # Simulate recruiter email: Interview invitation
        sim_res = await ac.post(
            f"/api/v1/applications/{app_id}/simulate-email-update",
            headers=headers,
            json={"update_type": "interview"}
        )
        assert sim_res.status_code == 200
        assert sim_res.json()["new_status"] == "INTERVIEW"

        # Ask AI Career Assistant
        asst_res = await ac.post(
            "/api/v1/assistant/query",
            headers=headers,
            json={"question": "How many active applications do I have?"}
        )
        assert asst_res.status_code == 200
        asst_data = asst_res.json()
        assert "active applications" in asst_data["answer"].lower()
