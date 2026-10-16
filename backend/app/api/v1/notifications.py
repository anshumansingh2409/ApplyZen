"""
ApplyZen Notifications Endpoints
"""
from typing import List
from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.database.repositories.notification_repository import notification_repo

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    notes = await notification_repo.list_by_user(current_user["_id"])
    for n in notes:
        n["id"] = n["_id"]
    return notes


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await notification_repo.mark_read(notification_id, current_user["_id"])
    return {"success": True}


@router.post("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    await notification_repo.mark_all_read(current_user["_id"])
    return {"success": True}
