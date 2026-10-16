"""
ApplyZen User Repository
"""
from typing import Optional, Dict, Any
from app.database.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if not email:
            return None
        return await self.get_one({"email": email.lower().strip()})

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        if not username:
            return None
        return await self.get_one({"username": username.lower().strip()})

    async def get_by_username_or_email(self, identifier: str) -> Optional[Dict[str, Any]]:
        if not identifier:
            return None
        clean = identifier.lower().strip()
        # Query with $or
        user = await self.get_one({"$or": [{"email": clean}, {"username": clean}]})
        if not user:
            user = await self.get_by_email(clean)
        if not user:
            user = await self.get_by_username(clean)
        return user


user_repo = UserRepository()
