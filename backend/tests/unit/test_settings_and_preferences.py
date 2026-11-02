"""
Test Settings, Preferences, 2FA, Password Change, Export, and Account Deletion
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.repositories.user_repository import user_repo
from app.database.mongodb import get_database


@pytest.mark.asyncio
async def test_settings_preferences_and_account_lifecycle():
    transport = ASGITransport(app=app)
    test_email = "settings_tester@applyzen.com"

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Cleanup prior run if needed
        existing = await user_repo.get_by_email(test_email)
        if existing:
            await user_repo.delete(existing["_id"])

        # 1. Signup
        signup_res = await ac.post("/api/v1/auth/signup", json={
            "email": test_email,
            "password": "InitialPassword123!",
            "full_name": "Settings Tester"
        })
        assert signup_res.status_code == 200

        # Auto-verify email
        user = await user_repo.get_by_email(test_email)
        assert user is not None
        otp = user.get("verification_otp")
        if otp:
            await ac.post("/api/v1/auth/verify-email", json={
                "email": test_email,
                "otp": otp
            })

        # 2. Login
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "InitialPassword123!"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Preferences: GET and PUT
        pref_get = await ac.get("/api/v1/auth/preferences", headers=headers)
        assert pref_get.status_code == 200
        assert "preferences" in pref_get.json()

        pref_put = await ac.put("/api/v1/auth/preferences", headers=headers, json={
            "ai_model": "zen-pro-analyst",
            "temperature": 65,
            "response_length": "Detailed",
            "theme": "Dark",
            "auto_apply": False,
            "auto_cover_letters": True,
            "application_strategy": "Aggressive Volume",
            "confidence_threshold": "High (80%+ Match)"
        })
        assert pref_put.status_code == 200
        updated_prefs = pref_put.json()["preferences"]
        assert updated_prefs["ai_model"] == "zen-pro-analyst"
        assert updated_prefs["temperature"] == 65
        assert updated_prefs["theme"] == "Dark"
        assert updated_prefs["auto_apply"] is False

        # 4. Two-Factor Authentication Toggle
        toggle_on = await ac.post("/api/v1/auth/toggle-2fa", headers=headers, json={"enabled": True})
        assert toggle_on.status_code == 200
        assert toggle_on.json()["two_factor_enabled"] is True

        user_db = await user_repo.get_by_email(test_email)
        assert user_db["two_factor_enabled"] is True

        toggle_off = await ac.post("/api/v1/auth/toggle-2fa", headers=headers, json={"enabled": False})
        assert toggle_off.status_code == 200
        assert toggle_off.json()["two_factor_enabled"] is False

        # 5. Change Password
        # Bad old password
        bad_pwd = await ac.post("/api/v1/auth/change-password", headers=headers, json={
            "current_password": "WrongPassword!",
            "new_password": "NewSecretPassword123!"
        })
        assert bad_pwd.status_code in [400, 401]

        # Valid password change
        good_pwd = await ac.post("/api/v1/auth/change-password", headers=headers, json={
            "current_password": "InitialPassword123!",
            "new_password": "NewSecretPassword123!"
        })
        assert good_pwd.status_code == 200

        # Login with new password should succeed
        new_login = await ac.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "NewSecretPassword123!"
        })
        assert new_login.status_code == 200
        new_token = new_login.json()["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}

        # 6. Data Export
        export_res = await ac.get("/api/v1/auth/export-data", headers=new_headers)
        assert export_res.status_code == 200
        export_data = export_res.json()
        assert "user" in export_data
        assert export_data["user"]["email"] == test_email
        assert "opportunities" in export_data
        assert "applications" in export_data
        assert "resumes" in export_data

        # 7. Delete Account
        delete_res = await ac.delete("/api/v1/auth/account", headers=new_headers)
        assert delete_res.status_code == 200
        assert delete_res.json()["success"] is True

        # Confirm user is completely gone from DB
        db = get_database()
        user_after = await db.users.find_one({"email": test_email})
        assert user_after is None
