"""
ApplyZen Opportunity Repository
Supports fast queries, deduplication matching, and lifecycle indexing.
"""
from typing import Optional, Dict, Any, List
from app.database.repositories.base_repository import BaseRepository


class OpportunityRepository(BaseRepository):
    def __init__(self):
        super().__init__("opportunities")

    async def list_by_user(self, user_id: str, limit: int = 200) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).limit(limit)
        items = await cursor.to_list(limit)

        def get_sort_key(doc):
            val = doc.get("email_received_at") or doc.get("email_timestamp") or doc.get("created_at")
            if not val:
                return ""
            return str(val)

        items.sort(key=get_sort_key, reverse=True)
        return items

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
        import re
        c_clean = company.strip()
        r_clean = role.strip()
        if c_clean and r_clean:
            match = await self.get_one({
                "user_id": user_id,
                "company": {"$regex": f"^{re.escape(c_clean)}$", "$options": "i"},
                "role": {"$regex": f"^{re.escape(r_clean)}$", "$options": "i"}
            })
            if match:
                return match

        return None


opportunity_repo = OpportunityRepository()
