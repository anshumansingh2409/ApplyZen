"""
ApplyZen Application Service
Coordinates review submissions, automatic mode triggers, status transitions, and audit records.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
import asyncio
from app.core.constants import ApplicationStatus
from app.database.repositories.application_repository import application_repo
from app.database.repositories.notification_repository import notification_repo
from app.automation.browser.playwright_manager import playwright_manager
from app.core.exceptions import NotFoundError, ActionRequiredError
from app.cache.locks import DistributedLock
from app.core.logging import logger


class ApplicationService:
    async def review_and_submit(
        self,
        app_id: str,
        user_id: str,
        updated_fields: List[Dict[str, Any]],
        approved: bool = True
    ) -> Dict[str, Any]:
        app = await application_repo.get_by_id(app_id)
        if not app or app.get("user_id") != user_id:
            raise NotFoundError("Application not found")

        # Update fields with user edits
        current_fields = app.get("form_fields", [])
        field_map = {f.get("field_name"): f for f in current_fields}

        for uf in updated_fields:
            name = uf.get("field_name")
            if name in field_map:
                field_map[name]["user_edited_value"] = uf.get("user_edited_value", uf.get("value"))
                field_map[name]["is_approved_by_user"] = True

        new_fields = list(field_map.values())

        if approved:
            lock = DistributedLock(f"submit:{app_id}", ttl_seconds=45)
            if not await lock.acquire():
                raise ActionRequiredError("Application submission is already in progress.", "SUBMISSION_LOCKED")

            try:
                # Execute browser submission
                result = await playwright_manager.fill_and_submit_form(
                    app.get("application_url", "https://apply.jobportal.com"),
                    new_fields,
                    dry_run=False
                )

                # Update status to SUBMITTED
                await application_repo.update(app_id, {
                    "form_fields": new_fields,
                    "status": ApplicationStatus.SUBMITTED.value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })

                await application_repo.update_status(
                    app_id,
                    ApplicationStatus.SUBMITTED,
                    "Application Submitted Successfully 🚀",
                    f"Candidate reviewed and approved {len(new_fields)} form fields. Submission completed via Playwright."
                )

                await application_repo.add_ai_log(
                    app_id,
                    f"Browser worker successfully submitted application to {app.get('company')}.",
                    "BrowserWorker",
                    confidence=1.0
                )

                # Update associated Opportunity status to APPLIED and clear cache
                opp_id = app.get("opportunity_id")
                if opp_id:
                    from app.database.repositories.opportunity_repository import opportunity_repo
                    await opportunity_repo.update(opp_id, {
                        "status": "APPLIED",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    })
                    from app.cache.redis import redis_manager
                    await redis_manager.delete(f"cache:opps:{user_id}")
                    await redis_manager.delete(f"cache:opp:{opp_id}")

                # Notification
                await notification_repo.create({
                    "_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "title": f"Application Submitted: {app.get('company')}",
                    "message": f"Your application for {app.get('role')} has been submitted successfully.",
                    "type": "status_change",
                    "priority": "normal",
                    "is_read": False,
                    "action_url": f"/applications/{app_id}",
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

                return {"success": True, "status": ApplicationStatus.SUBMITTED.value, "message": "Application submitted"}
            finally:
                await lock.release()
        else:
            # Saved edits without submission
            await application_repo.update(app_id, {
                "form_fields": new_fields,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
            return {"success": True, "status": app.get("status"), "message": "Form changes saved"}

    async def schedule_auto_submit(self, app_id: str, user_id: str, delay_sec: int):
        """
        Asynchronously waits until the deadline buffer / countdown expires (e.g. 1 minute)
        and then automatically triggers submission.
        """
        logger.info(f"[AutoSubmitScheduler] Scheduled submission for application {app_id} in {delay_sec} seconds")
        await asyncio.sleep(delay_sec)
        try:
            app = await application_repo.get_by_id(app_id)
            if app and app.get("status") == ApplicationStatus.AUTO_READY.value:
                logger.info(f"[AutoSubmitScheduler] Safety window passed. Submitting application {app_id}...")
                fields = app.get("form_fields", [])
                await self.review_and_submit(app_id, user_id, fields, approved=True)
                logger.info(f"[AutoSubmitScheduler] Application {app_id} successfully auto-submitted!")
        except Exception as e:
            logger.error(f"[AutoSubmitScheduler] Failed to auto-submit app {app_id}: {e}")

    async def process_due_auto_submits(self):
        """
        Durable periodic poller checking for applications scheduled for auto-submit whose timestamp has arrived.
        """
        from app.database.mongodb import get_database
        db = get_database()
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            cursor = db.applications.find({
                "status": ApplicationStatus.AUTO_READY.value,
                "scheduled_submit_at": {"$lte": now_iso}
            })
            due_apps = await cursor.to_list(20)
            for app in due_apps:
                app_id = app["_id"]
                user_id = app["user_id"]
                fields = app.get("form_fields", [])
                logger.info(f"[AutoSubmitPoller] Executing due auto-submit for app {app_id} ({app.get('company')})")
                await self.review_and_submit(app_id, user_id, fields, approved=True)
        except Exception as e:
            logger.error(f"[AutoSubmitPoller] Periodic check error: {e}")

    async def simulate_incoming_update(
        self,
        app_id: str,
        user_id: str,
        update_type: str  # "assessment", "interview", "offer", "rejection"
    ) -> Dict[str, Any]:
        """
        Simulates an incoming career email triggering lifecycle progression for demo/testing.
        """
        app = await application_repo.get_by_id(app_id)
        if not app or app.get("user_id") != user_id:
            raise NotFoundError("Application not found")

        status_mapping = {
            "assessment": (ApplicationStatus.ASSESSMENT, "Online Assessment Received 💻", "Online assessment link received from recruiter."),
            "interview": (ApplicationStatus.INTERVIEW, "Interview Scheduled 📅", "Recruiter invitation to schedule technical interview round."),
            "offer": (ApplicationStatus.OFFER, "Official Offer Received! 🎉", "Pleased to extend an offer of employment."),
            "rejection": (ApplicationStatus.REJECTED, "Application Concluded", "Company decided to move forward with other candidates.")
        }

        if update_type not in status_mapping:
            return {"success": False, "message": "Invalid update type"}

        st, title, desc = status_mapping[update_type]
        await application_repo.update_status(app_id, st, title, desc)
        await application_repo.add_ai_log(
            app_id,
            f"Tracker agent classified incoming email as {st.value}.",
            "TrackerAgent",
            confidence=0.98
        )

        await notification_repo.create({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": f"Update from {app.get('company')}: {title}",
            "message": desc,
            "type": "status_change",
            "priority": "high",
            "is_read": False,
            "action_url": f"/applications/{app_id}",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {"success": True, "new_status": st.value}


application_service = ApplicationService()
