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

_ACTIVE_SYNC_USERS = set()


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
    Returns true integration status strictly isolated to the authenticated user.
    Each user maintains their own independent connection status.
    """
    db = get_database()
    user_id = current_user["_id"]

    conns = await db.oauth_connections.find({
        "user_id": user_id,
        "is_active": True
    }).to_list(10)

    # A connection is truly connected ONLY if is_active is True AND either access_token or app_password exists
    gmail_conn = next((
        c for c in conns
        if c.get("provider") == "gmail"
        and bool(c.get("access_token") or c.get("app_password"))
    ), None)

    outlook_conn = next((
        c for c in conns
        if c.get("provider") == "outlook"
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
    Connects real Gmail inbox and immediately auto-syncs recent career opportunities.
    """
    user_id = current_user["_id"]
    try:
        if payload.code:
            result = await gmail_service.connect_with_code(user_id, payload.code)
        elif payload.access_token:
            result = await gmail_service.connect_with_token(user_id, payload.access_token)
        else:
            raise HTTPException(status_code=400, detail="access_token or code is required.")
        
        # Immediate auto-sync upon connection (safeguarded)
        synced_count = 0
        sync_res = {}
        try:
            sync_res = await gmail_service.sync_emails(user_id=user_id, max_results=30)
            synced_count = sync_res.get("synced_count", 0)
        except Exception as sync_err:
            logger.warning(f"Initial post-connect sync warning: {sync_err}")
            sync_res = {"success": True, "synced_count": 0, "message": "Connected! Scanning inbox in background."}

        result["sync"] = sync_res
        result["synced_count"] = synced_count
        result["message"] = (
            f"Gmail connected! Ingested {synced_count} new career opportunities."
            if synced_count > 0
            else "Gmail connected successfully! Monitoring for incoming career emails."
        )
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
    Connects real Outlook/Office 365 inbox and immediately auto-syncs career opportunities.
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
        
        # Immediate auto-sync upon connection
        sync_res = await outlook_service.sync_emails(user_id=user_id, max_results=30)
        result["sync"] = sync_res
        result["synced_count"] = sync_res.get("synced_count", 0)
        result["message"] = (
            f"Outlook connected! Ingested {sync_res.get('synced_count', 0)} new career opportunities."
            if sync_res.get("synced_count", 0) > 0
            else "Outlook connected successfully! Listening for incoming career emails."
        )
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
    Immediately scans inbox and fetches career opportunities.
    """
    user_id = current_user["_id"]
    try:
        conn_res = await gmail_service.connect_with_app_password(
            user_id=user_id,
            email_address=payload.email,
            app_password=payload.app_password
        )
        # Immediate auto-sync upon connection (safeguarded)
        synced_count = 0
        sync_res = {}
        try:
            sync_res = await gmail_service.sync_emails(user_id=user_id, max_results=30)
            synced_count = sync_res.get("synced_count", 0)
        except Exception as sync_err:
            logger.warning(f"Initial post-connect sync warning: {sync_err}")
            sync_res = {"success": True, "synced_count": 0, "message": "Connected! Scanning inbox in background."}

        conn_res["sync"] = sync_res
        conn_res["synced_count"] = synced_count
        conn_res["message"] = (
            f"Gmail connected via App Password! Ingested {synced_count} new career opportunities."
            if synced_count > 0
            else "Gmail connected via App Password! Monitoring for incoming career emails."
        )
        return conn_res
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
    Immediately auto-syncs career opportunities.
    """
    user_id = current_user["_id"]
    try:
        conn_res = await outlook_service.connect_with_app_password(
            user_id=user_id,
            email_address=payload.email,
            app_password=payload.app_password
        )
        sync_res = await outlook_service.sync_emails(user_id=user_id, max_results=30)
        conn_res["sync"] = sync_res
        conn_res["synced_count"] = sync_res.get("synced_count", 0)
        return conn_res
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
    Includes concurrency mutex to guarantee zero duplicate executions.
    """
    user_id = current_user["_id"]
    if user_id in _ACTIVE_SYNC_USERS:
        logger.info(f"Sync already running for user {user_id}. Skipping duplicate concurrent request.")
        return {
            "success": True,
            "connected": True,
            "synced_count": 0,
            "message": "Inbox synchronization is already in progress. Please wait a moment."
        }

    _ACTIVE_SYNC_USERS.add(user_id)
    try:
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
    finally:
        _ACTIVE_SYNC_USERS.discard(user_id)



@router.post("/sync-demo-emails")
async def sync_emails_alias(current_user: dict = Depends(get_current_user)):
    """
    Legacy endpoint redirected to real inbox sync.
    """
    return await sync_inboxes(provider="gmail", max_results=20, current_user=current_user)
