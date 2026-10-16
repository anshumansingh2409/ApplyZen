"""
ApplyZen Authentication Service
Handles Signup, Login, Password verification, Real Email verification, and Real Google OAuth.
"""
from datetime import datetime, timezone, timedelta
import uuid
import secrets
import random
import re
import urllib.request
import urllib.error
import json
from typing import Optional, Dict, Any, List
import httpx
from app.database.repositories.user_repository import user_repo
from app.database.repositories.career_profile_repository import career_profile_repo
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import AuthenticationError, DuplicateError
from app.schemas.auth import UserSignUp, UserLogin
from app.core.config import settings
from app.services.email_service import email_service
from app.core.logging import logger


class AuthService:
    async def signup(self, data: UserSignUp) -> dict:
        clean_email = data.email.lower().strip()
        existing = await user_repo.get_by_email(clean_email)
        
        # Check if already exists
        if existing:
            # If user exists but is unverified, resend verification token
            if existing.get("is_verified") is False:
                verification_token = secrets.token_urlsafe(32)
                verification_otp = f"{random.randint(100000, 999999)}"
                expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

                await user_repo.update(existing["_id"], {
                    "verification_token": verification_token,
                    "verification_otp": verification_otp,
                    "verification_expires_at": expires_at,
                    "full_name": data.full_name.strip(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })

                await email_service.send_verification_email(
                    clean_email, data.full_name.strip(), verification_token, verification_otp
                )

                return {
                    "status": "pending_verification",
                    "message": f"An unverified account exists with this email. A fresh verification code has been sent to {clean_email}.",
                    "email": clean_email
                }
            raise DuplicateError("A user with this email address already exists")

        # Determine and validate username
        if data.username and data.username.strip():
            username = data.username.lower().strip()
            if not re.match(r"^[a-zA-Z0-9_.-]+$", username):
                raise AuthenticationError("Username can only contain letters, numbers, underscores, and dots", "INVALID_USERNAME")
            existing_user = await user_repo.get_by_username(username)
            if existing_user:
                raise DuplicateError(f"Username '{username}' is already taken. Please choose another username.")
        else:
            base_username = clean_email.split("@")[0]
            base_username = re.sub(r"[^a-zA-Z0-9_]", "_", base_username)
            username = base_username
            existing_user = await user_repo.get_by_username(username)
            suffix = 1
            while existing_user:
                username = f"{base_username}_{suffix}"
                existing_user = await user_repo.get_by_username(username)
                suffix += 1

        user_id = str(uuid.uuid4())
        hashed_pwd = hash_password(data.password)

        verification_token = secrets.token_urlsafe(32)
        verification_otp = f"{random.randint(100000, 999999)}"
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        is_verified = not settings.EMAIL_VERIFICATION_REQUIRED

        new_user = {
            "_id": user_id,
            "email": clean_email,
            "username": username,
            "hashed_password": hashed_pwd,
            "full_name": data.full_name.strip(),
            "role": "user",
            "is_active": True,
            "is_verified": is_verified,
            "verification_token": verification_token if not is_verified else None,
            "verification_otp": verification_otp if not is_verified else None,
            "verification_expires_at": expires_at if not is_verified else None,
            "auth_provider": "local",
            "subscription_plan": "Free",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await user_repo.create(new_user)

        # Seed initial default Career Profile
        default_profile = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "full_name": data.full_name.strip(),
            "bio": f"Hi, I'm {data.full_name}. Passionate engineer looking for impactful career opportunities.",
            "education": [
                {
                    "institution": "National Institute of Technology",
                    "degree": "B.Tech",
                    "major": "Computer Science & Engineering",
                    "graduation_year": 2025,
                    "cgpa": 8.85
                }
            ],
            "skills": [
                {"name": "Python", "category": "Technical", "level": "Advanced"},
                {"name": "React", "category": "Technical", "level": "Advanced"},
                {"name": "JavaScript", "category": "Technical", "level": "Advanced"},
                {"name": "FastAPI", "category": "Technical", "level": "Advanced"},
                {"name": "MongoDB", "category": "Technical", "level": "Intermediate"}
            ],
            "projects": [
                {
                    "title": "ApplyZen Career Copilot",
                    "description": "AI-powered automated job application pipeline with verification and resume matching.",
                    "technologies": ["React", "FastAPI", "MongoDB"]
                }
            ],
            "experience": [],
            "preferences": {
                "desired_roles": ["Software Engineer", "Full Stack Developer", "Backend Engineer"],
                "preferred_locations": ["Remote", "Bengaluru", "San Francisco"],
                "will_relocate": True,
                "work_authorization": "Authorized to work without sponsorship",
                "notice_period_days": 15
            },
            "automation_policy": {
                "application_mode": "APPROVAL_MODE",
                "salary_policy": "ASK_USER",
                "relocation_policy": "ALLOW",
                "legal_declaration_policy": "ASK_USER",
                "sensitive_info_policy": "ASK_USER",
                "unknown_info_policy": "ASK_USER",
                "auto_submit_deadline_buffer_hours": 6
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await career_profile_repo.create(default_profile)

        # Send real verification email with OTP and link
        if not is_verified:
            await email_service.send_verification_email(
                clean_email, data.full_name.strip(), verification_token, verification_otp
            )
            return {
                "status": "pending_verification",
                "message": f"Great, now verify your email. A 6-digit verification code has been sent to {clean_email}.",
                "email": clean_email
            }

        # If verification is not required, immediately login
        token = create_access_token({
            "sub": user_id,
            "email": new_user["email"],
            "username": username,
            "role": new_user["role"]
        })
        user_info = {
            "id": user_id,
            "email": new_user["email"],
            "username": username,
            "full_name": new_user["full_name"],
            "role": new_user["role"],
            "subscription_plan": new_user["subscription_plan"]
        }
        return {"access_token": token, "token_type": "bearer", "user": user_info}

    async def login(self, data: UserLogin) -> dict:
        identifier = (data.username_or_email or data.username or data.email or "").strip()
        if not identifier:
            raise AuthenticationError("Please enter your username or email address", "MISSING_CREDENTIALS")

        user = await user_repo.get_by_username_or_email(identifier)
        if not user:
            raise AuthenticationError("Invalid username/email or password", "INVALID_CREDENTIALS")

        if not verify_password(data.password, user.get("hashed_password", "")):
            raise AuthenticationError("Invalid username/email or password", "INVALID_CREDENTIALS")

        # Check if email is verified
        if settings.EMAIL_VERIFICATION_REQUIRED and user.get("is_verified") is False:
            raise AuthenticationError(
                "Please verify your email address before signing in. Check your inbox for the verification code.",
                "EMAIL_NOT_VERIFIED"
            )

        user_id = user["_id"]
        username = user.get("username") or user.get("email", "").split("@")[0]
        token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "username": username,
            "role": user.get("role", "user")
        })
        user_info = {
            "id": user_id,
            "email": user["email"],
            "username": username,
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "user"),
            "subscription_plan": user.get("subscription_plan", "Free")
        }
        return {"access_token": token, "token_type": "bearer", "user": user_info}

    async def verify_email(self, token: str = None, email: str = None, otp: str = None) -> dict:
        user = None
        if token and token.strip():
            user = await user_repo.get_one({"verification_token": token.strip()})
        
        if not user and email and otp:
            user = await user_repo.get_one({
                "email": email.lower().strip(),
                "verification_otp": otp.strip()
            })

        if not user:
            raise AuthenticationError("Invalid or expired verification code or link.", "INVALID_VERIFICATION_TOKEN")

        # Check expiration if present
        exp = user.get("verification_expires_at")
        if exp:
            try:
                exp_dt = datetime.fromisoformat(exp)
                if datetime.now(timezone.utc) > exp_dt:
                    raise AuthenticationError("This verification code has expired. Please request a new one.", "EXPIRED_VERIFICATION_TOKEN")
            except Exception:
                pass

        # Mark user as verified
        await user_repo.update(user["_id"], {
            "is_verified": True,
            "verification_token": None,
            "verification_otp": None,
            "verification_expires_at": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

        user_id = user["_id"]
        username = user.get("username") or user["email"].split("@")[0]
        access_tok = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "username": username,
            "role": user.get("role", "user")
        })
        user_info = {
            "id": user_id,
            "email": user["email"],
            "username": username,
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "user"),
            "subscription_plan": user.get("subscription_plan", "Free")
        }
        return {
            "success": True,
            "message": "Email verified successfully! Welcome to ApplyZen.",
            "access_token": access_tok,
            "token_type": "bearer",
            "user": user_info
        }

    async def resend_verification(self, email: str) -> dict:
        clean_email = email.lower().strip()
        user = await user_repo.get_by_email(clean_email)
        if not user:
            return {"success": True, "message": f"If an account exists with {clean_email}, a verification code has been sent."}

        if user.get("is_verified") is True:
            return {"success": True, "message": "Your email is already verified. You can sign in directly."}

        new_token = secrets.token_urlsafe(32)
        new_otp = f"{random.randint(100000, 999999)}"
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

        await user_repo.update(user["_id"], {
            "verification_token": new_token,
            "verification_otp": new_otp,
            "verification_expires_at": expires_at,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

        await email_service.send_verification_email(
            clean_email, user.get("full_name", ""), new_token, new_otp
        )

        return {
            "success": True,
            "message": f"A fresh 6-digit verification code has been sent to {clean_email}. Please check your inbox."
        }

    async def forgot_password(self, email: str) -> dict:
        clean_email = email.lower().strip()
        user = await user_repo.get_by_email(clean_email)
        if not user:
            # For security, return success message to prevent user enumeration
            return {
                "success": True,
                "message": f"If an account is associated with {clean_email}, a 6-digit password reset code has been sent."
            }

        reset_token = secrets.token_urlsafe(32)
        reset_otp = f"{random.randint(100000, 999999)}"
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()

        await user_repo.update(user["_id"], {
            "reset_password_token": reset_token,
            "reset_password_otp": reset_otp,
            "reset_password_expires_at": expires_at,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

        await email_service.send_password_reset_email(
            clean_email, user.get("full_name", ""), reset_token, reset_otp
        )

        return {
            "success": True,
            "message": f"A 6-digit password reset code has been sent to {clean_email}.",
            "email": clean_email,
            "debug_otp": reset_otp if settings.DEBUG and not settings.RESEND_API_KEY else None
        }

    async def reset_password(self, email: str = None, token: str = None, otp: str = None, new_password: str = None) -> dict:
        if not new_password or len(new_password) < 6:
            raise AuthenticationError("New password must be at least 6 characters long.", "INVALID_PASSWORD")

        user = None
        if token and token.strip():
            user = await user_repo.get_one({"reset_password_token": token.strip()})

        if not user and email and otp:
            user = await user_repo.get_one({
                "email": email.lower().strip(),
                "reset_password_otp": otp.strip()
            })

        if not user:
            raise AuthenticationError("Invalid or expired password reset code. Please request a new one.", "INVALID_RESET_CODE")

        exp = user.get("reset_password_expires_at")
        if exp:
            try:
                exp_dt = datetime.fromisoformat(exp)
                if datetime.now(timezone.utc) > exp_dt:
                    raise AuthenticationError("Password reset code has expired. Please request a new one.", "EXPIRED_RESET_CODE")
            except Exception:
                pass

        new_hashed = hash_password(new_password)
        await user_repo.update(user["_id"], {
            "hashed_password": new_hashed,
            "reset_password_token": None,
            "reset_password_otp": None,
            "reset_password_expires_at": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

        return {
            "success": True,
            "message": "Your password has been reset successfully! You can now sign in with your new password."
        }

    async def google_auth(
        self,
        token: str = None,
        id_token: str = None,
        access_token: str = None,
        credential: str = None,
        mode: str = "login"
    ) -> dict:
        token_str = (credential or id_token or access_token or token or "").strip()
        if not token_str:
            raise AuthenticationError(
                "Google authentication token is required from Google Identity Services.",
                "MISSING_GOOGLE_TOKEN"
            )

        # Real Google Token Verification via Google OAuth2 endpoints
        google_data = None
        try:
            if access_token or token_str.startswith("ya29."):
                acc_tok = access_token or token_str
                url = "https://www.googleapis.com/oauth2/v3/userinfo"
                headers = {"Authorization": f"Bearer {acc_tok}"}
            else:
                url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token_str}"
                headers = {}

            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    google_data = resp.json()
                else:
                    logger.error(f"Google token verification failed (HTTP {resp.status_code}): {resp.text}")
                    raise AuthenticationError(
                        "Invalid or expired Google authentication credentials. Please try signing in again via Google.",
                        "INVALID_GOOGLE_TOKEN"
                    )
        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Error communicating with Google OAuth servers: {e}")
            raise AuthenticationError(
                f"Failed to verify Google account credentials with Google servers: {e}",
                "GOOGLE_AUTH_FAILED"
            )

        clean_email = (google_data.get("email") or "").lower().strip()
        if not clean_email:
            raise AuthenticationError("Google did not return a valid email address.", "GOOGLE_NO_EMAIL")

        email_verified = google_data.get("email_verified", True)
        if isinstance(email_verified, str):
            email_verified = email_verified.lower() == "true"
        if not email_verified:
            raise AuthenticationError("Your Google email is not verified by Google.", "UNVERIFIED_GOOGLE_EMAIL")

        full_name = (google_data.get("name") or clean_email.split("@")[0]).strip()
        avatar_url = google_data.get("picture")

        # Check existence in MongoDB
        user = await user_repo.get_by_email(clean_email)

        # If user does not exist, automatically register with Google credentials
        if not user:
            user_id = str(uuid.uuid4())
            base_username = clean_email.split("@")[0]
            base_username = re.sub(r"[^a-zA-Z0-9_]", "_", base_username)
            username = base_username
            existing_user = await user_repo.get_by_username(username)
            suffix = 1
            while existing_user:
                username = f"{base_username}_{suffix}"
                existing_user = await user_repo.get_by_username(username)
                suffix += 1

            new_user = {
                "_id": user_id,
                "email": clean_email,
                "username": username,
                "hashed_password": hash_password(str(uuid.uuid4())),
                "full_name": full_name,
                "avatar_url": avatar_url,
                "role": "user",
                "is_active": True,
                "is_verified": True,  # Pre-verified by Google OAuth
                "subscription_plan": "Free",
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await user_repo.create(new_user)
            user = new_user

            # Seed initial default Career Profile
            default_profile = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "full_name": user["full_name"],
                "headline": "Software Engineer & Builder",
                "bio": f"Hi, I'm {full_name}. Software professional leveraging ApplyZen autonomous automation.",
                "education": [
                    {
                        "institution": "National Institute of Technology",
                        "degree": "B.Tech",
                        "major": "Computer Science & Engineering",
                        "graduation_year": 2025,
                        "cgpa": 8.85
                    }
                ],
                "skills": [
                    {"name": "Python", "category": "Technical", "level": "Advanced"},
                    {"name": "React", "category": "Technical", "level": "Advanced"},
                    {"name": "FastAPI", "category": "Technical", "level": "Advanced"},
                    {"name": "MongoDB", "category": "Technical", "level": "Intermediate"}
                ],
                "projects": [
                    {
                        "title": "ApplyZen Career Copilot",
                        "description": "AI-powered automated job application pipeline with verification and resume matching.",
                        "technologies": ["React", "FastAPI", "MongoDB"]
                    }
                ],
                "experience": [],
                "preferences": {
                    "desired_roles": ["Software Engineer", "Full Stack Developer"],
                    "preferred_locations": ["Remote", "Bengaluru"],
                    "will_relocate": True,
                    "work_authorization": "Authorized to work without sponsorship",
                    "notice_period_days": 15
                },
                "automation_policy": {
                    "application_mode": "APPROVAL_MODE",
                    "salary_policy": "ASK_USER",
                    "relocation_policy": "ALLOW",
                    "legal_declaration_policy": "ASK_USER",
                    "sensitive_info_policy": "ASK_USER",
                    "unknown_info_policy": "ASK_USER",
                    "auto_submit_deadline_buffer_hours": 6
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await career_profile_repo.create(default_profile)
        else:
            # If account existed from previous manual registration, Google validates and verifies it
            if user.get("is_verified") is False:
                await user_repo.update(user["_id"], {
                    "is_verified": True,
                    "avatar_url": user.get("avatar_url") or avatar_url,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
                user["is_verified"] = True

        user_id = user["_id"]
        username = user.get("username") or user["email"].split("@")[0]
        token_jwt = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "username": username,
            "role": user.get("role", "user")
        })
        user_info = {
            "id": user_id,
            "email": user["email"],
            "username": username,
            "full_name": user.get("full_name", ""),
            "avatar_url": user.get("avatar_url") or avatar_url,
            "role": user.get("role", "user"),
            "subscription_plan": user.get("subscription_plan", "Free")
        }
        return {"access_token": token_jwt, "token_type": "bearer", "user": user_info}

    async def microsoft_auth(
        self,
        token: Optional[str] = None,
        access_token: Optional[str] = None,
        id_token: Optional[str] = None,
        code: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        mode: str = "login"
    ) -> dict:
        """
        Authenticates a user via Microsoft / Outlook OAuth 2.0.
        Supports access token or authorization code exchange.
        Automatically provisions account and career profile if new user.
        """
        resolved_token = (access_token or token or id_token or "").strip()

        # If authorization code provided, exchange it with Microsoft Identity Platform
        if code and not resolved_token:
            tenant_id = getattr(settings, "MICROSOFT_TENANT_ID", "common")
            client_id = getattr(settings, "MICROSOFT_CLIENT_ID", None)
            client_secret = getattr(settings, "MICROSOFT_CLIENT_SECRET", None)

            if not client_id:
                raise AuthenticationError(
                    "MICROSOFT_CLIENT_ID is not configured in backend/.env.",
                    "MISSING_MICROSOFT_CLIENT_ID"
                )

            token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            data = {
                "client_id": client_id,
                "code": code.strip(),
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri or getattr(settings, "MICROSOFT_REDIRECT_URI", "http://localhost:5173/auth/callback/microsoft"),
                "scope": "https://graph.microsoft.com/User.Read openid profile email"
            }
            if client_secret:
                data["client_secret"] = client_secret

            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    resp = await client.post(token_url, data=data)
                    if resp.status_code != 200:
                        logger.error(f"Microsoft OAuth code exchange error: {resp.text}")
                        raise AuthenticationError(
                            "Failed to exchange Microsoft authorization code.",
                            "INVALID_MICROSOFT_CODE"
                        )
                    token_json = resp.json()
                    resolved_token = token_json.get("access_token", "")
                except AuthenticationError:
                    raise
                except Exception as e:
                    logger.error(f"Error during Microsoft token exchange: {e}")
                    raise AuthenticationError(
                        f"Communication error with Microsoft identity servers: {e}",
                        "MICROSOFT_AUTH_FAILED"
                    )

        if not resolved_token:
            raise AuthenticationError(
                "Microsoft authentication token or code is required.",
                "MISSING_MICROSOFT_TOKEN"
            )

        # Validate token with Microsoft Graph
        profile_data = None
        try:
            headers = {"Authorization": f"Bearer {resolved_token}"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get("https://graph.microsoft.com/v1.0/me", headers=headers)
                if resp.status_code == 200:
                    profile_data = resp.json()
                else:
                    logger.error(f"Microsoft Graph token verification failed (HTTP {resp.status_code}): {resp.text}")
                    raise AuthenticationError(
                        "Invalid or expired Microsoft credentials. Please sign in again via Outlook.",
                        "INVALID_MICROSOFT_TOKEN"
                    )
        except AuthenticationError:
            raise
        except Exception as e:
            logger.error(f"Error communicating with Microsoft Graph: {e}")
            raise AuthenticationError(
                f"Failed to communicate with Microsoft Graph servers: {e}",
                "MICROSOFT_AUTH_FAILED"
            )

        clean_email = (profile_data.get("mail") or profile_data.get("userPrincipalName") or "").lower().strip()
        if not clean_email or "@" not in clean_email:
            raise AuthenticationError("Microsoft did not return a valid email address.", "MICROSOFT_NO_EMAIL")

        full_name = (profile_data.get("displayName") or clean_email.split("@")[0]).strip()

        # Check existence in MongoDB
        user = await user_repo.get_by_email(clean_email)

        if not user:
            user_id = str(uuid.uuid4())
            base_username = clean_email.split("@")[0]
            base_username = re.sub(r"[^a-zA-Z0-9_]", "_", base_username)
            username = base_username
            existing_user = await user_repo.get_by_username(username)
            suffix = 1
            while existing_user:
                username = f"{base_username}_{suffix}"
                existing_user = await user_repo.get_by_username(username)
                suffix += 1

            new_user = {
                "_id": user_id,
                "email": clean_email,
                "username": username,
                "hashed_password": hash_password(str(uuid.uuid4())),
                "full_name": full_name,
                "avatar_url": None,
                "role": "user",
                "is_active": True,
                "is_verified": True,  # Pre-verified by Microsoft OAuth
                "subscription_plan": "Free",
                "auth_provider": "microsoft",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await user_repo.create(new_user)
            user = new_user

            # Seed initial default Career Profile
            default_profile = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "full_name": user["full_name"],
                "headline": "Software Engineer & Builder",
                "bio": f"Hi, I'm {full_name}. Software professional leveraging ApplyZen autonomous automation.",
                "education": [
                    {
                        "institution": "National Institute of Technology",
                        "degree": "B.Tech",
                        "major": "Computer Science & Engineering",
                        "graduation_year": 2025,
                        "cgpa": 8.85
                    }
                ],
                "skills": [
                    {"name": "Python", "category": "Technical", "level": "Advanced"},
                    {"name": "React", "category": "Technical", "level": "Advanced"},
                    {"name": "FastAPI", "category": "Technical", "level": "Advanced"},
                    {"name": "MongoDB", "category": "Technical", "level": "Intermediate"}
                ],
                "projects": [
                    {
                        "title": "ApplyZen Career Copilot",
                        "description": "AI-powered automated job application pipeline with verification and resume matching.",
                        "technologies": ["React", "FastAPI", "MongoDB"]
                    }
                ],
                "experience": [],
                "preferences": {
                    "desired_roles": ["Software Engineer", "Full Stack Developer"],
                    "preferred_locations": ["Remote", "Bengaluru"],
                    "will_relocate": True,
                    "work_authorization": "Authorized to work without sponsorship",
                    "notice_period_days": 15
                },
                "automation_policy": {
                    "application_mode": "APPROVAL_MODE",
                    "salary_policy": "ASK_USER",
                    "relocation_policy": "ALLOW",
                    "legal_declaration_policy": "ASK_USER",
                    "sensitive_info_policy": "ASK_USER",
                    "unknown_info_policy": "ASK_USER",
                    "auto_submit_deadline_buffer_hours": 6
                },
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await career_profile_repo.create(default_profile)
        else:
            if user.get("is_verified") is False:
                await user_repo.update(user["_id"], {
                    "is_verified": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
                user["is_verified"] = True

        user_id = user["_id"]
        username = user.get("username") or user["email"].split("@")[0]
        token_jwt = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "username": username,
            "role": user.get("role", "user")
        })
        user_info = {
            "id": user_id,
            "email": user["email"],
            "username": username,
            "full_name": user.get("full_name", ""),
            "avatar_url": user.get("avatar_url"),
            "role": user.get("role", "user"),
            "subscription_plan": user.get("subscription_plan", "Free")
        }
        return {"access_token": token_jwt, "token_type": "bearer", "user": user_info}



auth_service = AuthService()
