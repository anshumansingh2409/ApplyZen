"""
ApplyZen Notification Repository
"""
from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository):
    def __init__(self):
        super().__init__("notifications")

    async def list_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return await self.list({"user_id": user_id}, limit=limit, sort_by="created_at", sort_dir=-1)

    async def mark_read(self, notification_id: str, user_id: str):
        await self.collection.update_one({"_id": notification_id, "user_id": user_id}, {"$set": {"is_read": True}})

    async def mark_all_read(self, user_id: str):
        await self.collection.update_many({"user_id": user_id}, {"$set": {"is_read": True}})


notification_repo = NotificationRepository()
