"""
ApplyZen Applications Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Body
from app.auth.dependencies import get_current_user
from app.database.repositories.application_repository import application_repo
from app.schemas.application import ApplicationReviewSubmit
from app.services.application_service import application_service
from app.automation.handlers.captcha_handler import captcha_handler
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("")
async def list_applications(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    apps = await application_repo.list_by_user(current_user["_id"], status=status)
    for a in apps:
        a["id"] = a["_id"]
    return apps


@router.get("/{application_id}")
async def get_application(application_id: str, current_user: dict = Depends(get_current_user)):
    app = await application_repo.get_by_id(application_id)
    if not app or app.get("user_id") != current_user["_id"]:
        raise NotFoundError("Application not found")
    app["id"] = app["_id"]
    return app


@router.post("/{application_id}/review")
async def review_application(
    application_id: str,
    payload: ApplicationReviewSubmit,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits user review and approvals for AI-filled fields.
    """
    fields_dict = [f.model_dump() for f in payload.updated_fields]
    result = await application_service.review_and_submit(
        app_id=application_id,
        user_id=current_user["_id"],
        updated_fields=fields_dict,
        approved=payload.approved
    )
    return result


@router.post("/{application_id}/trigger-captcha")
async def trigger_captcha_challenge(application_id: str, current_user: dict = Depends(get_current_user)):
    """
    Diagnostic/demo endpoint to simulate CAPTCHA discovery during browser automation.
    """
    return await captcha_handler.handle_captcha_detected(
        app_id=application_id,
        user_id=current_user["_id"],
        captcha_type="reCAPTCHA v2 / Image Puzzle",
        screenshot_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
    )


@router.post("/{application_id}/resolve-captcha")
async def resolve_captcha_challenge(application_id: str, current_user: dict = Depends(get_current_user)):
    """
    User triggers after human solving the CAPTCHA puzzle.
    """
    return await captcha_handler.handle_captcha_resolved(
        app_id=application_id,
        user_id=current_user["_id"]
    )


@router.post("/{application_id}/simulate-email-update")
async def simulate_email_update(
    application_id: str,
    update_type: str = Body(..., embed=True),  # assessment, interview, offer, rejection
    current_user: dict = Depends(get_current_user)
):
    """
    Simulates incoming recruiter email updating lifecycle state.
    """
    return await application_service.simulate_incoming_update(
        app_id=application_id,
        user_id=current_user["_id"],
        update_type=update_type
    )
