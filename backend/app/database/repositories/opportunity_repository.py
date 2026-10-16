"""
ApplyZen Opportunity Repository
Supports fast queries, deduplication matching, and lifecycle indexing.
"""
from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class OpportunityRepository(BaseRepository):
    def __init__(self):
        super().__init__("opportunities")

    async def list_by_user(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        return await self.list({"user_id": user_id}, limit=limit, sort_by="created_at", sort_dir=-1)

    async def find_duplicate(
        self,
        user_id: str,
        company: str,
        role: str,
        job_id: Optional[str] = None,
        application_url: Optional[str] = None,
        provider_message_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        # 1. Check provider message id if present
        if provider_message_id:
            match = await self.get_one({"user_id": user_id, "provider_message_id": provider_message_id})
            if match:
                return match

        # 2. Check job_id if provided
        if job_id:
            match = await self.get_one({"user_id": user_id, "company": {"$regex": f"^{company}$", "$options": "i"}, "job_id": job_id})
            if match:
                return match

        # 3. Check application_url if provided
        if application_url and len(application_url) > 10:
            match = await self.get_one({"user_id": user_id, "application_url": application_url})
            if match:
                return match

        # 4. Check company and role combination (case insensitive)
        all_user_opps = await self.list({"user_id": user_id}, limit=500)
        c_clean = company.lower().strip()
        r_clean = role.lower().strip()
        for opp in all_user_opps:
            if opp.get("company", "").lower().strip() == c_clean and opp.get("role", "").lower().strip() == r_clean:
                return opp

        return None


opportunity_repo = OpportunityRepository()
