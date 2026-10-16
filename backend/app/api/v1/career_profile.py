"""
ApplyZen Career Profile & Knowledge Base Endpoints
"""
from fastapi import APIRouter, Depends
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
