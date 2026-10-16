"""
ApplyZen Real Gmail Ingestion Service
Supports both:
1. Official Google OAuth 2.0 (Token / Code)
2. Direct Gmail App Password (IMAP SSL) for instant bypass of Google OAuth verification screens
Zero mock data — strictly real emails.
"""
import base64
import re
import imaplib
import email as pyemail
from email.header import decode_header
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
import httpx

from app.core.config import settings
from app.core.logging import logger
from app.database.mongodb import get_database
from app.ai.agents.orchestrator_agent import career_orchestrator
from app.ai.agents.opportunity_agent import opportunity_agent
from app.cache.redis import redis_manager


class GmailService:
    TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
    USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"
    GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

    async def connect_with_app_password(self, user_id: str, email_address: str, app_password: str) -> Dict[str, Any]:
        """
        Validates Gmail credentials via IMAP SSL and saves the connection.
        Requires a 16-character Google App Password (from myaccount.google.com/apppasswords).
        Does NOT require Google Cloud verification or test-user approvals!
        """
        clean_email = email_address.lower().strip()
        clean_pwd = app_password.replace(" ", "").strip()

        if not clean_email or "@" not in clean_email:
            raise ValueError("Please provide a valid Gmail address.")

        if len(clean_pwd) < 14:
            raise ValueError("Google App Passwords are 16 letters long. Please generate one at myaccount.google.com/apppasswords.")

        # Test IMAP connection synchronously in thread
        def verify_imap():
            try:
                mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
                mail.login(clean_email, clean_pwd)
                mail.logout()
                return True, None
            except Exception as e:
                err_msg = str(e)
                if "AuthenticationFailed" in err_msg or "credential" in err_msg.lower() or "application-specific" in err_msg.lower():
                    return False, "Invalid Gmail App Password. Make sure 2-Step Verification is ON and generate an App Password at myaccount.google.com/apppasswords."
                return False, f"IMAP connection failed: {err_msg}"

        success, err = await asyncio.to_thread(verify_imap)
        if not success:
            raise ValueError(err)

        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        conn_data = {
            "user_id": user_id,
            "provider": "gmail",
            "auth_type": "app_password",
            "account_email": clean_email,
            "account_name": clean_email.split("@")[0],
            "app_password": clean_pwd,
            "is_active": True,
            "connected_at": now_iso,
            "last_synced": now_iso,
            "updated_at": now_iso
        }

        await db.oauth_connections.update_one(
            {"user_id": user_id, "provider": "gmail"},
            {"$set": conn_data, "$setOnInsert": {"created_at": now_iso}},
            upsert=True
        )

        logger.info(f"✅ [GmailService] Connected Gmail via App Password: {clean_email}")
        return {
            "success": True,
            "provider": "gmail",
            "auth_type": "app_password",
            "connected": True,
            "account_email": clean_email,
            "connected_at": now_iso
        }

    async def connect_with_token(self, user_id: str, access_token: str, refresh_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates Google access token, fetches profile email, and saves active OAuth connection in MongoDB.
        """
        clean_token = access_token.strip()
        headers = {"Authorization": f"Bearer {clean_token}"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(self.USERINFO_ENDPOINT, headers=headers)
            if resp.status_code != 200:
                logger.error(f"Failed to verify Google access token: {resp.text}")
                raise ValueError("Invalid or expired Google access token. Please authenticate again.")
            userinfo = resp.json()

        email = (userinfo.get("email") or "").lower().strip()
        name = userinfo.get("name") or email.split("@")[0]
        if not email:
            raise ValueError("Google did not provide an email address for this connection.")

        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

        conn_data = {
            "user_id": user_id,
            "provider": "gmail",
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
            {"user_id": user_id, "provider": "gmail"},
            {"$set": conn_data, "$setOnInsert": {"created_at": now_iso}},
            upsert=True
        )

        logger.info(f"✅ [GmailService] Successfully connected real Gmail account via OAuth: {email} for user: {user_id}")
        return {
            "success": True,
            "provider": "gmail",
            "auth_type": "oauth",
            "connected": True,
            "account_email": email,
            "account_name": name,
            "connected_at": now_iso
        }

    async def connect_with_code(self, user_id: str, code: str) -> Dict[str, Any]:
        """
        Exchanges Google authorization code for access_token and refresh_token, then stores connection.
        """
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise ValueError("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in backend/.env.")

        data = {
            "code": code.strip(),
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": "postmessage",
            "grant_type": "authorization_code"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(self.TOKEN_ENDPOINT, data=data)
            if token_resp.status_code != 200:
                logger.error(f"Google code exchange failed: {token_resp.text}")
                data["redirect_uri"] = settings.GOOGLE_REDIRECT_URI
                token_resp = await client.post(self.TOKEN_ENDPOINT, data=data)
                if token_resp.status_code != 200:
                    raise ValueError(f"Failed to exchange Google authorization code: {token_resp.text}")

            tokens = token_resp.json()

        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        if not access_token:
            raise ValueError("No access token returned by Google.")

        return await self.connect_with_token(user_id, access_token=access_token, refresh_token=refresh_token)

    async def disconnect(self, user_id: str) -> Dict[str, Any]:
        """
        Completely disconnects and deletes stored Gmail connections for the user.
        """
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        user_email = (user.get("email") or "").lower().strip() if user else ""

        or_conditions = [{"user_id": user_id}]
        if user_email:
            or_conditions.append({"account_email": user_email})

        res = await db.oauth_connections.delete_many({
            "provider": "gmail",
            "$or": or_conditions
        })
        logger.info(f"Disconnected Gmail for user {user_id}, deleted {res.deleted_count} connection docs")
        return {"success": True, "provider": "gmail", "connected": False}

    async def get_valid_access_token(self, conn: dict) -> str:
        """
        Returns existing access token or refreshes it if expired and refresh_token is present.
        """
        access_token = conn.get("access_token")
        refresh_token = conn.get("refresh_token")
        expires_at_str = conn.get("token_expires_at")

        is_expired = False
        if expires_at_str:
            try:
                exp_dt = datetime.fromisoformat(expires_at_str)
                if datetime.now(timezone.utc) >= exp_dt:
                    is_expired = True
            except Exception:
                pass

        if is_expired and refresh_token and settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
            try:
                data = {
                    "refresh_token": refresh_token,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "grant_type": "refresh_token"
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(self.TOKEN_ENDPOINT, data=data)
                    if resp.status_code == 200:
                        new_tokens = resp.json()
                        new_acc = new_tokens.get("access_token")
                        new_exp = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
                        db = get_database()
                        await db.oauth_connections.update_one(
                            {"_id": conn["_id"]},
                            {"$set": {"access_token": new_acc, "token_expires_at": new_exp}}
                        )
                        return new_acc
            except Exception as e:
                logger.error(f"Failed to refresh Google access token: {e}")

        return access_token

    def _decode_message_payload(self, payload: dict) -> str:
        """
        Decodes Gmail message payload into plain text while preserving hyperlinks.
        """
        texts = []
        stack = [payload]

        while stack:
            curr = stack.pop()
            mime = curr.get("mimeType", "").lower()
            body = curr.get("body", {})
            data_str = body.get("data")

            if data_str:
                try:
                    padded = data_str + "=" * (-len(data_str) % 4)
                    raw_bytes = base64.urlsafe_b64decode(padded)
                    decoded_text = raw_bytes.decode("utf-8", errors="replace")
                    if "html" in mime:
                        clean = re.sub(r"<style[\s\S]*?</style>", "", decoded_text, flags=re.IGNORECASE)
                        clean = re.sub(r"<script[\s\S]*?</script>", "", clean, flags=re.IGNORECASE)
                        # Preserve href targets so Google Form links inside anchor tags are never lost
                        clean = re.sub(r'<a\s+[^>]*href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', r'\2 (\1)', clean, flags=re.IGNORECASE)
                        clean = re.sub(r"<[^>]+>", " ", clean)
                        clean = re.sub(r"\s+", " ", clean).strip()
                        texts.append(clean)
                    else:
                        texts.append(decoded_text)
                except Exception as e:
                    logger.debug(f"Error decoding body part: {e}")

            for part in curr.get("parts", []):
                stack.append(part)

        return "\n\n".join(texts).strip()

    def _is_career_relevant(self, subject: str, body: str, from_addr: str = "") -> bool:
        """
        Evaluates whether an email contains a Google Form application link for a career or campus recruitment opportunity.
        Strictly excludes emails without Google Form links, promotional spam, OTPs, and newsletters.
        """
        subj_lower = subject.lower()
        combined = f"{subject}\n{body}".lower()
        from_lower = from_addr.lower()

        # 1. Negative Filters: Exclude marketing / promotional / transactional emails
        promo_words = [
            "verify your email", "password reset", "security alert",
            "receipt", "invoice", "payment", "order confirmed", "newsletter",
            "weekly digest", "one-time passcode", "otp", "your code is",
            "webinar", "free masterclass", "course discount", "sale ends",
            "upgrade your account", "terms of service", "privacy policy updated"
        ]
        if any(pw in subj_lower for pw in promo_words):
            return False
        if "welcome to" in subj_lower:
            return False

        promo_domains = [
            "supabase.com", "cipherschools.com", "crio.do", "crio.in",
            "accounts.google.com", "spotify.com", "netflix.com", "youtube.com",
            "medium.com", "substack.com", "udemy.com", "coursera.com",
            "resend.dev", "support@github.com", "noreply@github.com",
            "mail.instagram.com", "facebookmail.com", "twitter.com", "x.com"
        ]
        if any(pd in from_lower for pd in promo_domains):
            return False

        # 2. Strict Google Form Requirement (user request: only detect emails with Google Form links)
        google_form_url = opportunity_agent.extract_google_form_url(f"{subject}\n{body}")
        if not google_form_url:
            return False

        return True

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
        return "".join(result)

    async def _sync_emails_imap(self, user_id: str, conn: dict, max_results: int = 20) -> Dict[str, Any]:
        """
        Scans real Gmail inbox using IMAP SSL.
        Bypasses all Google Cloud OAuth verification gates!
        """
        email_addr = conn.get("account_email")
        pwd = conn.get("app_password")
        db = get_database()

        def fetch_messages_via_imap():
            try:
                mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
                mail.login(email_addr, pwd)
                mail.select("INBOX", readonly=True)

                status, data = mail.search(None, 'ALL')
                if status != 'OK' or not data or not data[0]:
                    mail.close()
                    mail.logout()
                    return []

                id_list = data[0].split()
                # Check up to 80 recent messages for thorough coverage
                fetch_limit = max(max_results, 80)
                recent_ids = id_list[-fetch_limit:] if len(id_list) > fetch_limit else id_list
                recent_ids.reverse()  # newest first

                fetched_items = []
                for msg_id_bytes in recent_ids:
                    msg_id_str = msg_id_bytes.decode()
                    f_status, f_data = mail.fetch(msg_id_bytes, '(RFC822)')
                    if f_status == 'OK' and f_data and f_data[0]:
                        raw_email_bytes = f_data[0][1]
                        fetched_items.append((msg_id_str, raw_email_bytes))

                mail.close()
                mail.logout()
                return fetched_items
            except Exception as e:
                logger.error(f"[IMAP] Error fetching emails: {e}")
                return []

        raw_items = await asyncio.to_thread(fetch_messages_via_imap)
        logger.info(f"[GmailService-IMAP] Retrieved {len(raw_items)} recent email messages for {email_addr}")

        scanned_count = 0
        synced_count = 0

        for msg_id, raw_bytes in raw_items:
            # Check deduplication
            already_ingested = await db.ingested_emails.find_one({"user_id": user_id, "message_id": f"imap_{msg_id}"})
            if already_ingested:
                continue

            try:
                msg = pyemail.message_from_bytes(raw_bytes)
                scanned_count += 1

                subject = self._decode_imap_header(msg.get("Subject", "Career Opportunity"))
                from_header = self._decode_imap_header(msg.get("From", "recruiter@company.com"))
                date_header = msg.get("Date", datetime.now(timezone.utc).isoformat())

                # Extract text body
                body_parts = []
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        content_disp = str(part.get("Content-Disposition"))
                        if "attachment" not in content_disp:
                            payload = part.get_payload(decode=True)
                            if payload:
                                text_chunk = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
                                if content_type == "text/html":
                                    clean_chunk = re.sub(r"<style[\s\S]*?</style>", "", text_chunk, flags=re.IGNORECASE)
                                    clean_chunk = re.sub(r"<script[\s\S]*?</script>", "", clean_chunk, flags=re.IGNORECASE)
                                    clean_chunk = re.sub(r'<a\s+[^>]*href=["\'](https?://[^"\']+)["\'][^>]*>(.*?)</a>', r'\2 (\1)', clean_chunk, flags=re.IGNORECASE)
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

                if not self._is_career_relevant(subject, body_text, from_header):
                    await db.ingested_emails.insert_one({
                        "user_id": user_id,
                        "provider": "gmail",
                        "message_id": f"imap_{msg_id}",
                        "subject": subject,
                        "from": from_header,
                        "is_opportunity": False,
                        "ingested_at": datetime.now(timezone.utc).isoformat()
                    })
                    continue

                # Parse true email arrival time from IMAP Date header
                try:
                    parsed_dt = pyemail.utils.parsedate_to_datetime(date_header)
                    received_at_iso = parsed_dt.astimezone(timezone.utc).isoformat()
                except Exception:
                    received_at_iso = datetime.now(timezone.utc).isoformat()

                full_email_text = f"Subject: {subject}\nFrom: {from_header}\nDate: {date_header}\n\n{body_text}"
                process_res = await career_orchestrator.process_email_opportunity(
                    user_id=user_id,
                    email_content=full_email_text,
                    source_email=from_header,
                    provider_message_id=f"imap_{msg_id}",
                    email_received_at=received_at_iso,
                    connected_account=email_addr,
                    provider="gmail"
                )

                await db.ingested_emails.insert_one({
                    "user_id": user_id,
                    "provider": "gmail",
                    "message_id": f"imap_{msg_id}",
                    "subject": subject,
                    "from": from_header,
                    "is_opportunity": True,
                    "opportunity_id": process_res.get("opportunity_id"),
                    "ingested_at": datetime.now(timezone.utc).isoformat()
                })

                if process_res.get("status") != "duplicate_skipped":
                    synced_count += 1

            except Exception as e:
                logger.error(f"[GmailService-IMAP] Error parsing message {msg_id}: {e}")

        now_iso = datetime.now(timezone.utc).isoformat()
        await db.oauth_connections.update_one(
            {"_id": conn["_id"]},
            {"$set": {"last_synced": now_iso}}
        )
        # Invalidate Redis opportunities cache for real-time display
        await redis_manager.delete(f"cache:opps:{user_id}")

        msg_text = (
            f"Scanned {scanned_count} recent emails from {email_addr}. Added {synced_count} new opportunities!"
            if synced_count > 0
            else f"Scanned {scanned_count} recent emails from {email_addr}. No new career opportunities detected."
        )

        return {
            "success": True,
            "connected": True,
            "provider": "gmail",
            "auth_type": "app_password",
            "account_email": email_addr,
            "scanned_count": scanned_count,
            "synced_count": synced_count,
            "last_synced": now_iso,
            "message": msg_text
        }

    async def sync_emails(self, user_id: str, max_results: int = 15, query: Optional[str] = None) -> Dict[str, Any]:
        """
        Queries user's real connected Gmail inbox (either via IMAP App Password or OAuth REST API).
        """
        db = get_database()
        conn = await db.oauth_connections.find_one({"user_id": user_id, "provider": "gmail", "is_active": True})
        if not conn:
            return {
                "success": False,
                "connected": False,
                "message": "No active Gmail account connected. Please connect your Gmail inbox first."
            }

        # If connected via App Password, run IMAP sync
        if conn.get("auth_type") == "app_password":
            return await self._sync_emails_imap(user_id=user_id, conn=conn, max_results=max_results)

        # Otherwise OAuth REST API
        access_token = await self.get_valid_access_token(conn)
        if not access_token:
            return {
                "success": False,
                "connected": False,
                "message": "Gmail session expired. Please reconnect your Gmail account."
            }

        headers = {"Authorization": f"Bearer {access_token}"}
        google_form_keywords = '("forms.gle" OR "docs.google.com/forms" OR "forms.google.com" OR "google form" OR "google forms" OR forms.gle)'
        final_query = query if query else google_form_keywords
        effective_max = max(max_results, 60)

        messages_list = []
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                list_url = f"{self.GMAIL_API_BASE}/messages"
                params = {"maxResults": effective_max, "q": final_query}
                resp = await client.get(list_url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    messages_list = data.get("messages", [])
                elif resp.status_code in [401, 403]:
                    return {
                        "success": False,
                        "connected": False,
                        "message": "Google permission expired or revoked. Please reconnect your Gmail account."
                    }
                else:
                    return {
                        "success": False,
                        "connected": True,
                        "message": f"Gmail API error ({resp.status_code}). Please try again."
                    }
            except Exception as e:
                return {"success": False, "connected": True, "message": f"Network error communicating with Gmail: {e}"}

        scanned_count = 0
        synced_count = 0

        async with httpx.AsyncClient(timeout=20.0) as client:
            for stub in messages_list:
                msg_id = stub.get("id")
                if not msg_id:
                    continue

                already_ingested = await db.ingested_emails.find_one({"user_id": user_id, "message_id": msg_id})
                if already_ingested:
                    continue

                try:
                    msg_url = f"{self.GMAIL_API_BASE}/messages/{msg_id}?format=full"
                    m_resp = await client.get(msg_url, headers=headers)
                    if m_resp.status_code != 200:
                        continue

                    msg_data = m_resp.json()
                    scanned_count += 1

                    headers_list = msg_data.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "Career Opportunity")
                    from_header = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "recruiter@company.com")
                    date_header = next((h["value"] for h in headers_list if h["name"].lower() == "date"), datetime.now(timezone.utc).isoformat())

                    body_text = self._decode_message_payload(msg_data.get("payload", {}))
                    if not body_text:
                        body_text = msg_data.get("snippet", "")

                    if not self._is_career_relevant(subject, body_text, from_header):
                        await db.ingested_emails.insert_one({
                            "user_id": user_id,
                            "provider": "gmail",
                            "message_id": msg_id,
                            "subject": subject,
                            "from": from_header,
                            "is_opportunity": False,
                            "ingested_at": datetime.now(timezone.utc).isoformat()
                        })
                        continue

                    # Extract actual email arrival timestamp from Gmail internalDate
                    internal_date_ms = msg_data.get("internalDate")
                    received_at_iso = None
                    if internal_date_ms:
                        try:
                            received_dt = datetime.fromtimestamp(int(internal_date_ms) / 1000.0, tz=timezone.utc)
                            received_at_iso = received_dt.isoformat()
                        except Exception:
                            pass
                    if not received_at_iso:
                        try:
                            parsed_date = pyemail.utils.parsedate_to_datetime(date_header)
                            received_at_iso = parsed_date.astimezone(timezone.utc).isoformat()
                        except Exception:
                            received_at_iso = datetime.now(timezone.utc).isoformat()

                    full_email_text = f"Subject: {subject}\nFrom: {from_header}\nDate: {date_header}\n\n{body_text}"
                    process_res = await career_orchestrator.process_email_opportunity(
                        user_id=user_id,
                        email_content=full_email_text,
                        source_email=from_header,
                        provider_message_id=msg_id,
                        email_received_at=received_at_iso,
                        connected_account=conn.get("account_email"),
                        provider="gmail"
                    )

                    await db.ingested_emails.insert_one({
                        "user_id": user_id,
                        "provider": "gmail",
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
                    logger.error(f"Error processing Gmail message {msg_id}: {e}")

        now_iso = datetime.now(timezone.utc).isoformat()
        await db.oauth_connections.update_one(
            {"_id": conn["_id"]},
            {"$set": {"last_synced": now_iso}}
        )
        # Invalidate Redis opportunities cache for real-time display
        await redis_manager.delete(f"cache:opps:{user_id}")

        msg_text = (
            f"Successfully scanned {scanned_count} career emails from {conn.get('account_email')}. Added {synced_count} new opportunities!"
            if synced_count > 0
            else f"Scanned {scanned_count} recent emails from {conn.get('account_email')}. No new career opportunities found."
        )

        return {
            "success": True,
            "connected": True,
            "provider": "gmail",
            "account_email": conn.get("account_email"),
            "scanned_count": scanned_count,
            "synced_count": synced_count,
            "last_synced": now_iso,
            "message": msg_text
        }


gmail_service = GmailService()
