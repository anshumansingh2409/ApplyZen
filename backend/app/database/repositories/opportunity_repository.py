"""
ApplyZen Opportunity Repository
Supports fast queries, enterprise deduplication matching, and lifecycle indexing.
"""
from typing import Optional, Dict, Any, List
import re
from app.database.repositories.base_repository import BaseRepository


class OpportunityRepository(BaseRepository):
    def __init__(self):
        super().__init__("opportunities")

    def _normalize_name(self, text: Optional[str]) -> str:
        if not text:
            return ""
        # Lowercase and retain only alphanumeric characters
        return re.sub(r"[^a-z0-9]", "", text.lower())

    async def list_by_user(self, user_id: str, limit: int = 200) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"user_id": user_id}).limit(limit * 2)
        raw_items = await cursor.to_list(limit * 2)

        def get_sort_key(doc):
            val = doc.get("email_received_at") or doc.get("email_timestamp") or doc.get("created_at")
            if not val:
                return ""
            return str(val)

        raw_items.sort(key=get_sort_key, reverse=True)

        # Enterprise deduplication: ensures UI never receives duplicate cards
        seen_keys = set()
        deduped_items: List[Dict[str, Any]] = []

        for doc in raw_items:
            msg_id = doc.get("provider_message_id")
            clean_company = self._normalize_name(doc.get("company"))
            clean_role = self._normalize_name(doc.get("role"))

            key_msg = f"msg_{msg_id}" if msg_id else None
            key_job = f"job_{clean_company}_{clean_role}" if (clean_company and clean_role) else None

            if key_msg and key_msg in seen_keys:
                continue
            if key_job and key_job in seen_keys:
                continue

            if key_msg:
                seen_keys.add(key_msg)
            if key_job:
                seen_keys.add(key_job)

            deduped_items.append(doc)
            if len(deduped_items) >= limit:
                break

        return deduped_items

    async def find_duplicate(
        self,
        user_id: str,
        company: str,
        role: str,
        job_id: Optional[str] = None,
        application_url: Optional[str] = None,
        google_form_url: Optional[str] = None,
        provider_message_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        # 1. Check provider message id if present
        if provider_message_id:
            match = await self.get_one({"user_id": user_id, "provider_message_id": provider_message_id})
            if match:
                return match

        # 2. Check job_id if provided
        if job_id:
            match = await self.get_one({"user_id": user_id, "company": {"$regex": f"^{re.escape(company.strip())}$", "$options": "i"}, "job_id": job_id})
            if match:
                return match

        # 3. Check application_url if provided
        if application_url and len(application_url) > 15:
            # Strip query params like tracking IDs for exact URL matching
            base_url = application_url.split("?")[0].strip()
            if len(base_url) > 15:
                match = await self.get_one({"user_id": user_id, "application_url": {"$regex": f"^{re.escape(base_url)}", "$options": "i"}})
                if match:
                    return match

        # 4. Check google_form_url if provided
        if google_form_url and len(google_form_url) > 15:
            base_gform = google_form_url.split("?")[0].strip()
            match = await self.get_one({"user_id": user_id, "google_form_url": {"$regex": f"^{re.escape(base_gform)}", "$options": "i"}})
            if match:
                return match

        # 5. Check normalized company and role combination (case-insensitive and trimmed)
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

            # 6. Fuzzy alphanumeric check across existing opportunities for user
            all_user_opps = await self.list_by_user(user_id, limit=100)
            target_c = self._normalize_name(c_clean)
            target_r = self._normalize_name(r_clean)
            for opp in all_user_opps:
                if self._normalize_name(opp.get("company")) == target_c and self._normalize_name(opp.get("role")) == target_r:
                    return opp

        return None


opportunity_repo = OpportunityRepository()
