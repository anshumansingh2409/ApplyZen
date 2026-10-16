"""
ApplyZen Application Repository
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from app.database.repositories.base_repository import BaseRepository
from app.core.constants import ApplicationStatus


class ApplicationRepository(BaseRepository):
    def __init__(self):
        super().__init__("applications")

    async def list_by_user(self, user_id: str, status: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status
        return await self.list(query, limit=limit, sort_by="updated_at", sort_dir=-1)

    async def get_by_opportunity(self, user_id: str, opportunity_id: str) -> Optional[Dict[str, Any]]:
        return await self.get_one({"user_id": user_id, "opportunity_id": opportunity_id})

    async def update_status(self, app_id: str, new_status: ApplicationStatus, timeline_title: str, timeline_desc: str) -> Optional[Dict[str, Any]]:
        app = await self.get_by_id(app_id)
        if not app:
            return None
        timeline = app.get("timeline", [])
        timeline.append({
            "title": timeline_title,
            "description": timeline_desc,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status_tag": new_status.value if hasattr(new_status, "value") else str(new_status)
        })
        return await self.update(app_id, {
            "status": new_status.value if hasattr(new_status, "value") else str(new_status),
            "timeline": timeline,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

    async def add_ai_log(self, app_id: str, activity: str, agent_name: str, confidence: Optional[float] = None, details: Optional[Dict[str, Any]] = None):
        app = await self.get_by_id(app_id)
        if not app:
            return None
        ai_log = app.get("ai_activity_log", [])
        ai_log.append({
            "activity": activity,
            "agent_name": agent_name,
            "confidence": confidence,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details or {}
        })
        return await self.update(app_id, {
            "ai_activity_log": ai_log,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })


application_repo = ApplicationRepository()
