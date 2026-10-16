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
    PasswordResetConfirm
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
    current_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    from app.core.security import verify_password, hash_password
    from app.database.repositories.user_repository import user_repo
    from app.core.exceptions import AuthenticationError

    if not verify_password(current_password, current_user.get("hashed_password", "")):
        raise AuthenticationError("Current password is incorrect")

    await user_repo.update(current_user["_id"], {"hashed_password": hash_password(new_password)})
    return {"success": True, "message": "Password changed successfully"}


@router.post("/toggle-2fa")
async def toggle_2fa(
    enabled: bool = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    from app.database.repositories.user_repository import user_repo
    await user_repo.update(current_user["_id"], {"two_factor_enabled": enabled})
    return {"success": True, "two_factor_enabled": enabled}


@router.get("/export-data")
async def export_data(current_user: dict = Depends(get_current_user)):
    from app.database.repositories.career_profile_repository import career_profile_repo
    from app.database.repositories.opportunity_repository import opportunity_repo
    from app.database.repositories.application_repository import application_repo

    profile = await career_profile_repo.get_by_user_id(current_user["_id"])
    opps = await opportunity_repo.list_by_user(current_user["_id"])
    apps = await application_repo.list_by_user(current_user["_id"])

    return {
        "user": {
            "email": current_user.get("email"),
            "full_name": current_user.get("full_name"),
            "role": current_user.get("role"),
            "subscription_plan": current_user.get("subscription_plan")
        },
        "career_profile": profile,
        "opportunities": opps,
        "applications": apps
    }


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    from app.database.repositories.user_repository import user_repo
    await user_repo.update(current_user["_id"], {"is_active": False, "deleted": True})
    return {"success": True, "message": "Account has been deleted"}
