"""
ApplyZen Authentication Endpoints
"""
from fastapi import APIRouter, Depends, Body
from app.schemas.auth import (
    UserSignUp,
    UserLogin,
    TokenResponse,
    GoogleAuthRequest,
    MicrosoftAuthRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordPayload,
    Toggle2FAPayload,
    UserPreferencesPayload
)
from app.auth.service import auth_service
from app.auth.dependencies import get_current_user
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup")
async def signup(payload: UserSignUp):
    return await auth_service.signup(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    return await auth_service.login(payload)


@router.post("/google")
async def google_auth(payload: GoogleAuthRequest):
    return await auth_service.google_auth(
        token=payload.token,
        id_token=payload.id_token,
        access_token=payload.access_token,
        credential=payload.credential,
        mode=payload.mode or "login"
    )


@router.post("/microsoft")
async def microsoft_auth(payload: MicrosoftAuthRequest):
    return await auth_service.microsoft_auth(
        token=payload.token,
        access_token=payload.access_token,
        id_token=payload.id_token,
        code=payload.code,
        redirect_uri=payload.redirect_uri,
        mode=payload.mode or "login"
    )


@router.post("/verify-email")
async def verify_email(payload: VerifyEmailRequest):
    return await auth_service.verify_email(
        token=payload.token,
        email=payload.email,
        otp=payload.otp
    )


@router.post("/resend-verification")
async def resend_verification(payload: ResendVerificationRequest):
    return await auth_service.resend_verification(payload.email)


@router.post("/forgot-password")
async def forgot_password(payload: PasswordResetRequest):
    return await auth_service.forgot_password(payload.email)


@router.post("/reset-password")
async def reset_password(payload: PasswordResetConfirm):
    return await auth_service.reset_password(
        email=payload.email,
        token=payload.token,
        otp=payload.otp,
        new_password=payload.new_password
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "username": current_user.get("username") or current_user.get("email", "").split("@")[0],
        "full_name": current_user.get("full_name", ""),
        "role": current_user.get("role", "Software Engineer"),
        "is_active": current_user.get("is_active", True),
        "created_at": current_user.get("created_at"),
        "subscription_plan": current_user.get("subscription_plan", "Free"),
        "two_factor_enabled": current_user.get("two_factor_enabled", False)
    }


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordPayload,
    current_user: dict = Depends(get_current_user)
):
    from app.core.security import verify_password, hash_password
    from app.database.repositories.user_repository import user_repo
    from app.core.exceptions import AuthenticationError

    if not verify_password(payload.current_password, current_user.get("hashed_password", "")):
        raise AuthenticationError("Current password is incorrect")

    await user_repo.update(current_user["_id"], {"hashed_password": hash_password(payload.new_password)})
    return {"success": True, "message": "Password changed successfully"}


@router.post("/toggle-2fa")
async def toggle_2fa(
    payload: Toggle2FAPayload,
    current_user: dict = Depends(get_current_user)
):
    from app.database.repositories.user_repository import user_repo
    await user_repo.update(current_user["_id"], {"two_factor_enabled": payload.enabled})
    return {"success": True, "two_factor_enabled": payload.enabled}


@router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    prefs = current_user.get("preferences", {})
    return {
        "success": True,
        "preferences": {
            "ai_model": prefs.get("ai_model", "zen-4-turbo"),
            "temperature": prefs.get("temperature", 80),
            "response_length": prefs.get("response_length", "Balanced"),
            "theme": prefs.get("theme", "Light"),
            "auto_apply": prefs.get("auto_apply", True),
            "auto_cover_letters": prefs.get("auto_cover_letters", True),
            "application_strategy": prefs.get("application_strategy", "Quality Focused (Highly Targeted)"),
            "confidence_threshold": prefs.get("confidence_threshold", "Very High (90%+ Match)")
        }
    }


@router.put("/preferences")
async def update_preferences(
    payload: UserPreferencesPayload,
    current_user: dict = Depends(get_current_user)
):
    from app.database.repositories.user_repository import user_repo
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    current_prefs = current_user.get("preferences", {})
    current_prefs.update(update_data)
    await user_repo.update(current_user["_id"], {"preferences": current_prefs})
    return {"success": True, "preferences": current_prefs, "message": "Preferences saved successfully"}


@router.get("/export-data")
async def export_data(current_user: dict = Depends(get_current_user)):
    from app.database.repositories.career_profile_repository import career_profile_repo
    from app.database.repositories.opportunity_repository import opportunity_repo
    from app.database.repositories.application_repository import application_repo
    from app.database.mongodb import get_database

    db = get_database()
    user_id = current_user["_id"]

    profile = await career_profile_repo.get_by_user_id(user_id)
    opps = await opportunity_repo.list_by_user(user_id)
    apps = await application_repo.list_by_user(user_id)
    resumes = await db.resumes.find({"user_id": user_id}).to_list(100)

    # Clean object IDs for JSON serialization
    for r in resumes:
        if "_id" in r:
            r["_id"] = str(r["_id"])

    return {
        "user": {
            "id": user_id,
            "email": current_user.get("email"),
            "full_name": current_user.get("full_name"),
            "username": current_user.get("username"),
            "role": current_user.get("role"),
            "subscription_plan": current_user.get("subscription_plan"),
            "two_factor_enabled": current_user.get("two_factor_enabled", False),
            "created_at": current_user.get("created_at")
        },
        "career_profile": profile,
        "opportunities": opps,
        "applications": apps,
        "resumes": resumes
    }


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    from app.database.mongodb import get_database
    db = get_database()
    user_id = current_user["_id"]

    # Completely wipe all user records across all database collections
    await db.users.delete_one({"_id": user_id})
    await db.career_profiles.delete_many({"user_id": user_id})
    await db.opportunities.delete_many({"user_id": user_id})
    await db.applications.delete_many({"user_id": user_id})
    await db.resumes.delete_many({"user_id": user_id})
    await db.oauth_connections.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})
    await db.ingested_emails.delete_many({"user_id": user_id})

    return {"success": True, "message": "Your account and all associated data have been permanently deleted"}
