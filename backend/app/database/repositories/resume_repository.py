"""
ApplyZen Resume Repository
"""
from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class ResumeRepository(BaseRepository):
    def __init__(self):
        super().__init__("resumes")

    async def list_by_user(self, user_id: str, email: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id}
        if email:
            query = {"$or": [{"user_id": user_id}, {"user_email": email}]}
        return await self.list(query, limit=50, sort_by="uploaded_at", sort_dir=-1)

    async def get_preferred(self, user_id: str, email: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id, "is_preferred": True}
        if email:
            query = {"$or": [{"user_id": user_id, "is_preferred": True}, {"user_email": email, "is_preferred": True}]}
        return await self.get_one(query)

    async def set_preferred(self, user_id: str, resume_id: str, email: Optional[str] = None):
        # Clear other preferred flags
        clear_query: Dict[str, Any] = {"user_id": user_id}
        if email:
            clear_query = {"$or": [{"user_id": user_id}, {"user_email": email}]}
        await self.collection.update_many(clear_query, {"$set": {"is_preferred": False}})
        # Set target as preferred
        await self.collection.update_one({"_id": resume_id}, {"$set": {"is_preferred": True}})


resume_repo = ResumeRepository()
