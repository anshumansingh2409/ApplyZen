"""
ApplyZen Career Profile Repository
"""
from typing import Optional, Dict, Any
from app.database.repositories.base_repository import BaseRepository


class CareerProfileRepository(BaseRepository):
    def __init__(self):
        super().__init__("career_profiles")

    async def get_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.get_one({"user_id": user_id})

    async def upsert_by_user_id(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        existing = await self.get_by_user_id(user_id)
        if existing:
            await self.collection.update_one({"user_id": user_id}, {"$set": profile_data})
            return await self.get_by_user_id(user_id)
        else:
            profile_data["user_id"] = user_id
            return await self.create(profile_data)


career_profile_repo = CareerProfileRepository()
