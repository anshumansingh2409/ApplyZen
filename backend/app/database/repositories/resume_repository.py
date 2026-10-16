"""
ApplyZen Resume Repository
"""
from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class ResumeRepository(BaseRepository):
    def __init__(self):
        super().__init__("resumes")

    async def list_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.list({"user_id": user_id}, limit=50, sort_by="uploaded_at", sort_dir=-1)

    async def get_preferred(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.get_one({"user_id": user_id, "is_preferred": True})

    async def set_preferred(self, user_id: str, resume_id: str):
        # Clear other preferred flags
        await self.collection.update_many({"user_id": user_id}, {"$set": {"is_preferred": False}})
        # Set target as preferred
        await self.collection.update_one({"_id": resume_id, "user_id": user_id}, {"$set": {"is_preferred": True}})


resume_repo = ResumeRepository()
