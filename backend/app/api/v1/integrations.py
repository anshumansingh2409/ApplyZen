"""
ApplyZen Real Email Integrations Endpoints (Gmail & Microsoft Outlook)
Connects real inboxes via OAuth 2.0 and synchronizes incoming career emails into opportunities.
No hardcoded mock data.
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Body, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.database.mongodb import get_database
from app.services.gmail_service import gmail_service
from app.services.outlook_service import outlook_service
from app.core.logging import logger

router = APIRouter(prefix="/integrations", tags=["Integrations"])


class GoogleConnectPayload(BaseModel):
    access_token: Optional[str] = None
    code: Optional[str] = None


class MicrosoftConnectPayload(BaseModel):
    access_token: Optional[str] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None


class AppPasswordPayload(BaseModel):
    email: str
    app_password: str


@router.get("/status")
async def get_integrations_status(current_user: dict = Depends(get_current_user)):
    """
    Returns true integration status for the authenticated user.
    If not connected, returns connected=False and account_email=None.
    """
    db = get_database()
    user_id = current_user["_id"]
    user_email = (current_user.get("email") or "").lower().strip()

    conns = await db.oauth_connections.find({
        "$or": [
            {"user_id": user_id},
            {"account_email": user_email}
        ]
    }).to_list(10)

    # Self-heal user_id if needed
    for c in conns:
        if c.get("user_id") != user_id and c.get("account_email") == user_email:
            await db.oauth_connections.update_one({"_id": c["_id"]}, {"$set": {"user_id": user_id}})

    # A connection is truly connected ONLY if is_active is True AND either access_token or app_password exists
    gmail_conn = next((
        c for c in conns
        if c.get("provider") == "gmail"
        and c.get("is_active") is True
        and bool(c.get("access_token") or c.get("app_password"))
    ), None)

    outlook_conn = next((
        c for c in conns
        if c.get("provider") == "outlook"
        and c.get("is_active") is True
        and bool(c.get("access_token") or c.get("app_password"))
    ), None)

    return {
        "gmail": {
            "connected": bool(gmail_conn),
            "account_email": gmail_conn.get("account_email") if gmail_conn else None,
            "account_name": gmail_conn.get("account_name") if gmail_conn else None,
            "last_synced": gmail_conn.get("last_synced") if gmail_conn else None,
            "connected_at": gmail_conn.get("connected_at") if gmail_conn else None
        },
        "outlook": {
            "connected": bool(outlook_conn),
            "account_email": outlook_conn.get("account_email") if outlook_conn else None,
            "account_name": outlook_conn.get("account_name") if outlook_conn else None,
            "last_synced": outlook_conn.get("last_synced") if outlook_conn else None,
            "connected_at": outlook_conn.get("connected_at") if outlook_conn else None
        }
    }


@router.post("/google/connect")
async def connect_google_inbox(
    payload: GoogleConnectPayload,
    current_user: dict = Depends(get_current_user)
):
    """
    Connects real Gmail inbox using Google OAuth authorization code or access token.
    """
    user_id = current_user["_id"]
    try:
        if payload.code:
            result = await gmail_service.connect_with_code(user_id, payload.code)
        elif payload.access_token:
            result = await gmail_service.connect_with_token(user_id, payload.access_token)
        else:
            raise HTTPException(status_code=400, detail="access_token or code is required.")
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error connecting Google inbox: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect Google account: {str(e)}")


@router.post("/microsoft/connect")
async def connect_microsoft_inbox(
    payload: MicrosoftConnectPayload,
    current_user: dict = Depends(get_current_user)
):
    """
    Connects real Outlook/Office 365 inbox using Microsoft OAuth authorization code or access token.
    """
    user_id = current_user["_id"]
    try:
        if payload.code:
            result = await outlook_service.connect_with_code(
                user_id=user_id,
                code=payload.code,
                redirect_uri=payload.redirect_uri
            )
        elif payload.access_token:
            result = await outlook_service.connect_with_token(user_id, payload.access_token)
        else:
            raise HTTPException(status_code=400, detail="access_token or code is required.")
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error connecting Microsoft inbox: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect Microsoft Outlook account: {str(e)}")


@router.post("/gmail/app-password")
async def connect_gmail_app_password(
    payload: AppPasswordPayload,
    current_user: dict = Depends(get_current_user)
):
    """
    Connects Gmail using 16-letter App Password (IMAP SSL).
    Bypasses Google Cloud Console OAuth verification screens completely.
    """
    user_id = current_user["_id"]
    try:
        return await gmail_service.connect_with_app_password(
            user_id=user_id,
            email_address=payload.email,
            app_password=payload.app_password
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error connecting Gmail via App Password: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect Gmail: {str(e)}")


@router.post("/outlook/app-password")
async def connect_outlook_app_password(
    payload: AppPasswordPayload,
    current_user: dict = Depends(get_current_user)
):
    """
    Connects Outlook / Hotmail / Office 365 using password or App Password via IMAP SSL.
    """
    user_id = current_user["_id"]
    try:
        return await outlook_service.connect_with_app_password(
            user_id=user_id,
            email_address=payload.email,
            app_password=payload.app_password
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error connecting Outlook via App Password: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to connect Outlook: {str(e)}")


@router.post("/google/disconnect")
async def disconnect_google_inbox(current_user: dict = Depends(get_current_user)):
    """
    Disconnects Gmail integration and deactivates tokens.
    """
    return await gmail_service.disconnect(current_user["_id"])


@router.post("/microsoft/disconnect")
async def disconnect_microsoft_inbox(current_user: dict = Depends(get_current_user)):
    """
    Disconnects Outlook integration and deactivates tokens.
    """
    return await outlook_service.disconnect(current_user["_id"])


@router.post("/disconnect/{provider}")
async def disconnect_provider(provider: str, current_user: dict = Depends(get_current_user)):
    """
    Disconnects specified OAuth provider.
    """
    prov = provider.lower()
    if prov in ["gmail", "google"]:
        return await gmail_service.disconnect(current_user["_id"])
    elif prov in ["outlook", "microsoft"]:
        return await outlook_service.disconnect(current_user["_id"])

    db = get_database()
    await db.oauth_connections.update_one(
        {"user_id": current_user["_id"], "provider": prov},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "provider": provider, "connected": False}


@router.post("/sync")
async def sync_inboxes(
    provider: str = Body("gmail", embed=True),
    max_results: int = Body(20, embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Performs real inbox scan on the user's connected email account (Gmail or Outlook).
    Extracts authentic career emails and adds them to opportunities.
    No mock data is generated.
    """
    user_id = current_user["_id"]
    prov = provider.lower()

    if prov in ["gmail", "google"]:
        return await gmail_service.sync_emails(user_id=user_id, max_results=max_results)
    elif prov in ["outlook", "microsoft"]:
        return await outlook_service.sync_emails(user_id=user_id, max_results=max_results)
    elif prov == "all":
        gmail_res = await gmail_service.sync_emails(user_id=user_id, max_results=max_results)
        outlook_res = await outlook_service.sync_emails(user_id=user_id, max_results=max_results)
        return {
            "success": True,
            "gmail": gmail_res,
            "outlook": outlook_res,
            "synced_count": gmail_res.get("synced_count", 0) + outlook_res.get("synced_count", 0)
        }
    else:
        return {
            "success": False,
            "connected": False,
            "message": f"Inbox sync for '{provider}' is not supported. Please connect Gmail or Outlook."
        }



@router.post("/sync-demo-emails")
async def sync_emails_alias(current_user: dict = Depends(get_current_user)):
    """
    Legacy endpoint redirected to real inbox sync.
    """
    return await sync_inboxes(provider="gmail", max_results=20, current_user=current_user)
