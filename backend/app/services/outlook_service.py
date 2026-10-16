"""
ApplyZen Real Microsoft Outlook & Office 365 Integration Service
Supports:
1. Official Microsoft Graph REST API OAuth 2.0 (Access Token / Authorization Code)
2. Direct Outlook App Password / IMAP SSL (outlook.office365.com) for instant connection
Fetches genuine career/job emails and automatically extracts company opportunities via career_orchestrator.
No mock data.
"""
import imaplib
import email
from email.header import decode_header
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.database.mongodb import get_database
from app.ai.agents.orchestrator_agent import career_orchestrator


class OutlookService:
    GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"
    TOKEN_ENDPOINT_TEMPLATE = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"

    def __init__(self):
        self.tenant_id = getattr(settings, "MICROSOFT_TENANT_ID", "common")

    @property
    def token_endpoint(self) -> str:
        return self.TOKEN_ENDPOINT_TEMPLATE.format(tenant=self.tenant_id)

    async def connect_with_app_password(
        self,
        user_id: str,
        email_address: str,
        app_password: str
    ) -> Dict[str, Any]:
        """
        Connects Outlook / Hotmail / Office365 inbox via IMAP SSL (outlook.office365.com).
        Allows instant connection without complex Azure Cloud verification.
        """
        clean_email = email_address.strip().lower()
        clean_password = app_password.strip().replace(" ", "")

        if "@" not in clean_email:
            raise ValueError("Please provide a valid Outlook/Office365 email address.")
        if len(clean_password) < 4:
            raise ValueError("Please enter a valid Outlook or Office 365 password/app password.")

        try:
            valid, err = self._verify_imap_connection(clean_email, clean_password)
            if not valid:
                raise ValueError(err)
        except Exception as e:
            logger.error(f"[OutlookService] IMAP connection check failed: {e}")
            raise ValueError(f"Failed to authenticate with Outlook mail server: {str(e)}")

        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()

        conn_data = {
            "user_id": user_id,
            "provider": "outlook",
            "auth_type": "app_password",
            "account_email": clean_email,
            "account_name": clean_email.split("@")[0],
            "app_password": clean_password,
            "is_active": True,
            "connected_at": now_iso,
            "last_synced": now_iso,
            "updated_at": now_iso
        }

        await db.oauth_connections.update_one(
            {"user_id": user_id, "provider": "outlook"},
            {"$set": conn_data, "$setOnInsert": {"created_at": now_iso}},
            upsert=True
        )

        logger.info(f"✅ [OutlookService] Connected Outlook via IMAP/App Password: {clean_email} for user: {user_id}")
        return {
            "success": True,
            "provider": "outlook",
            "auth_type": "app_password",
            "connected": True,
            "account_email": clean_email,
            "account_name": clean_email.split("@")[0],
            "connected_at": now_iso
        }

    def _verify_imap_connection(self, email_addr: str, password: str):
        """Validates IMAP credentials against outlook.office365.com:993."""
        try:
            mail = imaplib.IMAP4_SSL("outlook.office365.com", 993, timeout=15)
            mail.login(email_addr, password)
            mail.select("INBOX", readonly=True)
            mail.close()
            mail.logout()
            return True, None
        except imaplib.IMAP4.error as e:
            err_str = str(e).lower()
            if "authenticationfailed" in err_str or "logon failure" in err_str:
                return False, "Authentication failed. For Microsoft/Outlook accounts with 2FA, please generate an App Password from account.live.com/proofs/manage or check IMAP access."
            return False, f"Outlook IMAP error: {e}"
        except Exception as e:
            return False, f"Could not reach Outlook mail server: {e}"

    async def connect_with_token(
        self,
        user_id: str,
        access_token: str,
        refresh_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates Microsoft access token, fetches profile from Microsoft Graph, and saves active OAuth connection in MongoDB.
        """
        clean_token = access_token.strip()
        headers = {"Authorization": f"Bearer {clean_token}"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{self.GRAPH_API_BASE}/me", headers=headers)
            if resp.status_code != 200:
                logger.error(f"Failed to verify Microsoft access token: {resp.text}")
                raise ValueError("Invalid or expired Microsoft access token. Please authenticate again.")
            profile = resp.json()

        email = (profile.get("mail") or profile.get("userPrincipalName") or "").lower().strip()
        name = profile.get("displayName") or (email.split("@")[0] if email else "Outlook User")
        if not email:
            raise ValueError("Microsoft did not provide a valid email address for this connection.")

        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

        conn_data = {
            "user_id": user_id,
            "provider": "outlook",
            "auth_type": "oauth",
            "account_email": email,
            "account_name": name,
            "access_token": clean_token,
            "refresh_token": refresh_token,
            "token_expires_at": expires_at,
            "is_active": True,
            "connected_at": now_iso,
            "last_synced": now_iso,
            "updated_at": now_iso
        }

        await db.oauth_connections.update_one(
            {"user_id": user_id, "provider": "outlook"},
            {"$set": conn_data, "$setOnInsert": {"created_at": now_iso}},
            upsert=True
        )

        logger.info(f"✅ [OutlookService] Successfully connected real Outlook account via OAuth: {email} for user: {user_id}")
        return {
            "success": True,
            "provider": "outlook",
            "auth_type": "oauth",
            "connected": True,
            "account_email": email,
            "account_name": name,
            "connected_at": now_iso
        }

    async def connect_with_code(
        self,
        user_id: str,
        code: str,
        redirect_uri: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exchanges Microsoft authorization code for access_token and refresh_token, then stores connection.
        """
        client_id = getattr(settings, "MICROSOFT_CLIENT_ID", None)
        client_secret = getattr(settings, "MICROSOFT_CLIENT_SECRET", None)

        if not client_id:
            raise ValueError("MICROSOFT_CLIENT_ID is not configured in backend/.env.")

        data = {
            "client_id": client_id,
            "code": code.strip(),
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri or getattr(settings, "MICROSOFT_REDIRECT_URI", "http://localhost:5173/auth/callback/microsoft"),
            "scope": "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read openid profile email offline_access"
        }
        if client_secret:
            data["client_secret"] = client_secret

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(self.token_endpoint, data=data)
            if token_resp.status_code != 200:
                logger.error(f"Microsoft code exchange failed: {token_resp.text}")
                raise ValueError(f"Failed to exchange Microsoft authorization code: {token_resp.text}")
            token_json = token_resp.json()

        access_token = token_json.get("access_token")
        refresh_token = token_json.get("refresh_token")

        if not access_token:
            raise ValueError("No access token returned by Microsoft.")

        return await self.connect_with_token(user_id, access_token, refresh_token)

    async def disconnect(self, user_id: str) -> Dict[str, Any]:
        """Disconnects Outlook integration and deactivates tokens."""
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        user_email = (user.get("email") or "").lower().strip() if user else ""

        or_conditions = [{"user_id": user_id}]
        if user_email:
            or_conditions.append({"account_email": user_email})

        res = await db.oauth_connections.delete_many({
            "provider": "outlook",
            "$or": or_conditions
        })
        logger.info(f"Disconnected Outlook for user {user_id}, deleted {res.deleted_count} connection docs")
        return {"success": True, "provider": "outlook", "connected": False, "disconnected": res.deleted_count > 0}

    async def get_valid_access_token(self, conn: dict) -> Optional[str]:
        """Checks access token expiration and refreshes with Microsoft OAuth if needed."""
        access_token = conn.get("access_token")
        refresh_token = conn.get("refresh_token")
        expires_at_str = conn.get("token_expires_at")

        is_expired = False
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) >= expires_at - timedelta(minutes=5):
                    is_expired = True
            except Exception:
                is_expired = False

        client_id = getattr(settings, "MICROSOFT_CLIENT_ID", None)
        client_secret = getattr(settings, "MICROSOFT_CLIENT_SECRET", None)

        if is_expired and refresh_token and client_id:
            data = {
                "client_id": client_id,
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "scope": "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read openid profile email offline_access"
            }
            if client_secret:
                data["client_secret"] = client_secret

            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(self.token_endpoint, data=data)
                    if resp.status_code == 200:
                        new_data = resp.json()
                        access_token = new_data["access_token"]
                        new_refresh = new_data.get("refresh_token", refresh_token)
                        expires_in = new_data.get("expires_in", 3600)
                        new_expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

                        db = get_database()
                        await db.oauth_connections.update_one(
                            {"_id": conn["_id"]},
                            {
                                "$set": {
                                    "access_token": access_token,
                                    "refresh_token": new_refresh,
                                    "token_expires_at": new_expires_at,
                                    "updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                        logger.info(f"🔄 Refreshed Microsoft Outlook access token for {conn.get('account_email')}")
            except Exception as e:
                logger.error(f"Failed to refresh Microsoft access token: {e}")

        return access_token

    def _is_career_relevant(self, subject: str, body: str) -> bool:
        """Evaluates whether an email appears to be career, job, hiring, interview, or assessment related."""
        combined = f"{subject}\n{body}".lower()
        signals = [
            "job", "internship", "hiring", "interview", "offer",
            "opportunity", "recruitment", "career", "applicant",
            "application status", "assessment", "hackerrank", "codility",
            "shortlisted", "referral", "opening", "invitation to apply",
            "stipend", "salary", "ctc", "role:", "position:", "applyzen"
        ]
        return any(s in combined for s in signals)

    def _decode_imap_header(self, raw_header: str) -> str:
        """Decodes MIME encoded header strings."""
        if not raw_header:
            return ""
        decoded_parts = decode_header(raw_header)
        result = []
        for content, encoding in decoded_parts:
            if isinstance(content, bytes):
                try:
                    result.append(content.decode(encoding or "utf-8", errors="replace"))
                except Exception:
                    result.append(content.decode("utf-8", errors="replace"))
            else:
                result.append(str(content))
        return " ".join(result).strip()

    async def _sync_emails_imap(self, user_id: str, conn: dict, max_results: int = 15) -> Dict[str, Any]:
        """Polls connected Outlook/Office 365 inbox via IMAP SSL."""
        email_addr = conn.get("account_email")
        password = conn.get("app_password")

        if not email_addr or not password:
            return {"success": False, "connected": False, "message": "Outlook credentials not found."}

        db = get_database()
        scanned_count = 0
        synced_count = 0

        try:
            mail = imaplib.IMAP4_SSL("outlook.office365.com", 993, timeout=20)
            mail.login(email_addr, password)
            mail.select("INBOX", readonly=True)

            status, search_data = mail.search(None, "ALL")
            if status != "OK" or not search_data or not search_data[0]:
                mail.close()
                mail.logout()
                return {
                    "success": True,
                    "connected": True,
                    "provider": "outlook",
                    "auth_type": "app_password",
                    "account_email": email_addr,
                    "scanned_count": 0,
                    "synced_count": 0,
                    "message": "No emails found in Outlook Inbox."
                }

            all_ids = search_data[0].split()
            fetch_limit = max(max_results, 50)
            recent_ids = all_ids[-fetch_limit:] if len(all_ids) > fetch_limit else all_ids
            recent_ids.reverse()

            for msg_id_bytes in recent_ids:
                msg_id = msg_id_bytes.decode()
                already_ingested = await db.ingested_emails.find_one({
                    "user_id": user_id,
                    "message_id": f"outlook_imap_{msg_id}"
                })
                if already_ingested:
                    continue

                res, data = mail.fetch(msg_id_bytes, "(RFC822)")
                if res != "OK" or not data or not data[0]:
                    continue

                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)
                scanned_count += 1

                subject = self._decode_imap_header(msg.get("Subject", "Career Opportunity"))
                from_header = self._decode_imap_header(msg.get("From", "recruiter@company.com"))
                date_header = msg.get("Date", datetime.now(timezone.utc).isoformat())

                body_parts = []
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        disposition = str(part.get("Content-Disposition", ""))
                        if "attachment" in disposition:
                            continue
                        if content_type in ["text/plain", "text/html"]:
                            payload = part.get_payload(decode=True)
                            if payload:
                                charset = part.get_content_charset() or "utf-8"
                                text_chunk = payload.decode(charset, errors="replace")
                                if content_type == "text/html":
                                    clean_chunk = re.sub(r"<style[\s\S]*?</style>", "", text_chunk, flags=re.IGNORECASE)
                                    clean_chunk = re.sub(r"<script[\s\S]*?</script>", "", clean_chunk, flags=re.IGNORECASE)
                                    clean_chunk = re.sub(r"<[^>]+>", " ", clean_chunk)
                                    clean_chunk = re.sub(r"\s+", " ", clean_chunk).strip()
                                    body_parts.append(clean_chunk)
                                else:
                                    body_parts.append(text_chunk)
                else:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        body_parts.append(payload.decode(msg.get_content_charset() or "utf-8", errors="replace"))

                body_text = "\n\n".join(body_parts).strip()

                if not self._is_career_relevant(subject, body_text):
                    await db.ingested_emails.insert_one({
                        "user_id": user_id,
                        "provider": "outlook",
                        "message_id": f"outlook_imap_{msg_id}",
                        "subject": subject,
                        "from": from_header,
                        "is_opportunity": False,
                        "ingested_at": datetime.now(timezone.utc).isoformat()
                    })
                    continue

                # Parse email date
                try:
                    parsed_dt = email.utils.parsedate_to_datetime(date_header)
                    received_at_iso = parsed_dt.astimezone(timezone.utc).isoformat()
                except Exception:
                    received_at_iso = datetime.now(timezone.utc).isoformat()

                full_email_text = f"Subject: {subject}\nFrom: {from_header}\nDate: {date_header}\n\n{body_text}"
                process_res = await career_orchestrator.process_email_opportunity(
                    user_id=user_id,
                    email_content=full_email_text,
                    source_email=from_header,
                    provider_message_id=f"outlook_imap_{msg_id}",
                    email_received_at=received_at_iso,
                    connected_account=email_addr,
                    provider="outlook"
                )

                await db.ingested_emails.insert_one({
                    "user_id": user_id,
                    "provider": "outlook",
                    "message_id": f"outlook_imap_{msg_id}",
                    "subject": subject,
                    "from": from_header,
                    "is_opportunity": True,
                    "opportunity_id": process_res.get("opportunity_id"),
                    "ingested_at": datetime.now(timezone.utc).isoformat()
                })

                if process_res.get("status") != "duplicate_skipped":
                    synced_count += 1

            mail.close()
            mail.logout()

        except Exception as e:
            logger.error(f"[OutlookService-IMAP] Error during sync: {e}")
            return {"success": False, "connected": True, "message": f"Outlook IMAP sync error: {e}"}

        now_iso = datetime.now(timezone.utc).isoformat()
        await db.oauth_connections.update_one(
            {"_id": conn["_id"]},
            {"$set": {"last_synced": now_iso}}
        )

        msg_text = (
            f"Scanned {scanned_count} recent Outlook emails from {email_addr}. Extracted {synced_count} new opportunities!"
            if synced_count > 0
            else f"Scanned {scanned_count} recent Outlook emails from {email_addr}. No new career opportunities detected."
        )

        return {
            "success": True,
            "connected": True,
            "provider": "outlook",
            "auth_type": "app_password",
            "account_email": email_addr,
            "scanned_count": scanned_count,
            "synced_count": synced_count,
            "last_synced": now_iso,
            "message": msg_text
        }

    async def sync_emails(self, user_id: str, max_results: int = 20) -> Dict[str, Any]:
        """
        Synchronizes career emails from the user's connected Outlook / Microsoft account.
        Uses either IMAP App Password or Microsoft Graph REST API.
        """
        db = get_database()
        conn = await db.oauth_connections.find_one({"user_id": user_id, "provider": "outlook", "is_active": True})
        if not conn:
            return {
                "success": False,
                "connected": False,
                "message": "No active Outlook account connected. Please connect your Outlook inbox first."
            }

        # If connected via App Password, run IMAP sync
        if conn.get("auth_type") == "app_password":
            return await self._sync_emails_imap(user_id=user_id, conn=conn, max_results=max_results)

        # Otherwise Microsoft Graph REST API
        access_token = await self.get_valid_access_token(conn)
        if not access_token:
            return {
                "success": False,
                "connected": False,
                "message": "Outlook session expired. Please reconnect your Outlook account."
            }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Prefer": 'outlook.body-content-type="text"'
        }

        messages_list = []
        async with httpx.AsyncClient(timeout=25.0) as client:
            try:
                # Query recent inbox messages via Microsoft Graph
                graph_url = f"{self.GRAPH_API_BASE}/me/mailFolders/inbox/messages"
                params = {
                    "$top": str(max_results),
                    "$select": "id,subject,bodyPreview,body,from,receivedDateTime",
                    "$orderby": "receivedDateTime desc"
                }
                resp = await client.get(graph_url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    messages_list = data.get("value", [])
                elif resp.status_code in [401, 403]:
                    return {
                        "success": False,
                        "connected": False,
                        "message": "Microsoft permission expired or revoked. Please reconnect your Outlook account."
                    }
                else:
                    logger.error(f"[OutlookService] Microsoft Graph error {resp.status_code}: {resp.text}")
                    return {
                        "success": False,
                        "connected": True,
                        "message": f"Microsoft Graph error ({resp.status_code}). Please try again."
                    }
            except Exception as e:
                logger.error(f"[OutlookService] Network error communicating with Microsoft Graph: {e}")
                return {"success": False, "connected": True, "message": f"Network error communicating with Microsoft: {e}"}

        scanned_count = 0
        synced_count = 0

        for msg in messages_list:
            msg_id = msg.get("id")
            if not msg_id:
                continue

            already_ingested = await db.ingested_emails.find_one({"user_id": user_id, "message_id": msg_id})
            if already_ingested:
                continue

            try:
                scanned_count += 1
                subject = msg.get("subject") or "Career Opportunity"
                from_obj = msg.get("from", {}).get("emailAddress", {})
                from_header = f"{from_obj.get('name', '')} <{from_obj.get('address', 'recruiter@company.com')}>".strip()
                date_header = msg.get("receivedDateTime") or datetime.now(timezone.utc).isoformat()

                # Extract body text
                body_content = msg.get("body", {}).get("content", "")
                if msg.get("body", {}).get("contentType", "").lower() == "html":
                    clean = re.sub(r"<style[\s\S]*?</style>", "", body_content, flags=re.IGNORECASE)
                    clean = re.sub(r"<script[\s\S]*?</script>", "", clean, flags=re.IGNORECASE)
                    clean = re.sub(r"<[^>]+>", " ", clean)
                    body_text = re.sub(r"\s+", " ", clean).strip()
                else:
                    body_text = body_content or msg.get("bodyPreview", "")

                if not self._is_career_relevant(subject, body_text):
                    await db.ingested_emails.insert_one({
                        "user_id": user_id,
                        "provider": "outlook",
                        "message_id": msg_id,
                        "subject": subject,
                        "from": from_header,
                        "is_opportunity": False,
                        "ingested_at": datetime.now(timezone.utc).isoformat()
                    })
                    continue

                received_at_iso = msg.get("receivedDateTime") or datetime.now(timezone.utc).isoformat()
                full_email_text = f"Subject: {subject}\nFrom: {from_header}\nDate: {date_header}\n\n{body_text}"
                process_res = await career_orchestrator.process_email_opportunity(
                    user_id=user_id,
                    email_content=full_email_text,
                    source_email=from_header,
                    provider_message_id=msg_id,
                    email_received_at=received_at_iso,
                    connected_account=conn.get("account_email"),
                    provider="outlook"
                )

                await db.ingested_emails.insert_one({
                    "user_id": user_id,
                    "provider": "outlook",
                    "message_id": msg_id,
                    "subject": subject,
                    "from": from_header,
                    "is_opportunity": True,
                    "opportunity_id": process_res.get("opportunity_id"),
                    "ingested_at": datetime.now(timezone.utc).isoformat()
                })

                if process_res.get("status") != "duplicate_skipped":
                    synced_count += 1

            except Exception as e:
                logger.error(f"[OutlookService] Error processing Outlook message {msg_id}: {e}")

        now_iso = datetime.now(timezone.utc).isoformat()
        await db.oauth_connections.update_one(
            {"_id": conn["_id"]},
            {"$set": {"last_synced": now_iso}}
        )

        msg_text = (
            f"Successfully scanned {scanned_count} Outlook career emails from {conn.get('account_email')}. Added {synced_count} new opportunities!"
            if synced_count > 0
            else f"Scanned {scanned_count} Outlook emails from {conn.get('account_email')}. No new career opportunities detected."
        )

        return {
            "success": True,
            "connected": True,
            "provider": "outlook",
            "auth_type": "oauth",
            "account_email": conn.get("account_email"),
            "scanned_count": scanned_count,
            "synced_count": synced_count,
            "last_synced": now_iso,
            "message": msg_text
        }


outlook_service = OutlookService()
