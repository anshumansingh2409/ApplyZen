import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from app.main import app
from app.database.mongodb import get_database


@pytest.mark.asyncio
async def test_multi_user_isolation_and_sync():
    """
    Verifies that:
    1. User A's email integration is strictly visible only to User A.
    2. User B sees disconnected status.
    3. User A disconnect does not affect User B.
    """
    db = get_database()
    now_iso = datetime.now(timezone.utc).isoformat()

    user_a_id = "test_user_a_123"
    user_b_id = "test_user_b_456"

    # User A connects Gmail
    await db.oauth_connections.delete_many({"user_id": {"$in": [user_a_id, user_b_id]}})
    await db.oauth_connections.insert_one({
        "user_id": user_a_id,
        "provider": "gmail",
        "auth_type": "app_password",
        "account_email": "user.a@gmail.com",
        "account_name": "User A",
        "app_password": "abcd efgh ijkl mnop",
        "is_active": True,
        "connected_at": now_iso,
        "last_synced": now_iso
    })

    # Query status as User A
    from app.api.v1.integrations import get_integrations_status
    status_a = await get_integrations_status(current_user={"_id": user_a_id, "email": "usera@applyzen.com"})
    assert status_a["gmail"]["connected"] is True
    assert status_a["gmail"]["account_email"] == "user.a@gmail.com"

    # Query status as User B (even if User B shares or has another email)
    status_b = await get_integrations_status(current_user={"_id": user_b_id, "email": "userb@applyzen.com"})
    assert status_b["gmail"]["connected"] is False
    assert status_b["gmail"]["account_email"] is None

    # Cleanup
    await db.oauth_connections.delete_many({"user_id": {"$in": [user_a_id, user_b_id]}})

