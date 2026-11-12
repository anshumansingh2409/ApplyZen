"""
ApplyZen Career Profile & Knowledge Base Endpoints
"""
from fastapi import APIRouter, Depends, Body
from app.auth.dependencies import get_current_user
from app.database.repositories.career_profile_repository import career_profile_repo
from app.schemas.career_profile import CareerProfileSchema

router = APIRouter(prefix="/career-profile", tags=["Career Profile"])


@router.get("", response_model=CareerProfileSchema)
async def get_profile(current_user: dict = Depends(get_current_user)):
    profile = await career_profile_repo.get_by_user_id(current_user["_id"])
    if not profile:
        profile = {"user_id": current_user["_id"]}
    return profile


@router.put("", response_model=CareerProfileSchema)
async def update_profile(payload: CareerProfileSchema, current_user: dict = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    updated = await career_profile_repo.upsert_by_user_id(current_user["_id"], data)
    return updated


@router.post("/submission-mode")
async def update_submission_mode(
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Updates the candidate's preferred submission mode:
    - 'APPROVAL_MODE' (User Accept: AI pre-fills form, user reviews & accepts to submit)
    - 'AUTOMATIC_MODE' (Auto Submit: AI pre-fills form, automatically submits 1 min before deadline/timer)
    """
    user_id = current_user["_id"]
    mode = payload.get("mode", "APPROVAL_MODE")
    profile = await career_profile_repo.get_by_user_id(user_id) or {}
    automation_policy = profile.get("automation_policy", {})
    automation_policy["application_mode"] = mode
    if "buffer_minutes" in payload:
        automation_policy["auto_submit_deadline_buffer_hours"] = payload["buffer_minutes"] / 60.0
    await career_profile_repo.upsert_by_user_id(user_id, {"automation_policy": automation_policy})
    return {"success": True, "mode": mode, "message": f"Submission mode updated to {mode}"}
