"""
ApplyZen CAPTCHA Handler
Strict Human-In-The-Loop compliance: zero automated bypassing.
Pauses workflow, captures diagnostic context, alerts user, and monitors resolution.
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from app.core.constants import ApplicationStatus
from app.database.repositories.application_repository import application_repo
from app.database.repositories.notification_repository import notification_repo
from app.core.logging import logger


class CaptchaHandler:
    async def handle_captcha_detected(
        self,
        app_id: str,
        user_id: str,
        captcha_type: str = "recaptcha",
        screenshot_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Pauses automation when CAPTCHA is encountered and generates human action required state.
        """
        logger.warning(f"CAPTCHA detected for Application {app_id}. Triggering Human-In-The-Loop pause.")

        app = await application_repo.get_by_id(app_id)
        if not app:
            return {"success": False, "message": "Application not found"}

        # 1. Update application state to ACTION_REQUIRED with CAPTCHA context
        await application_repo.update(app_id, {
            "status": ApplicationStatus.ACTION_REQUIRED.value,
            "captcha_context": {
                "detected": True,
                "captcha_type": captcha_type,
                "screenshot_url": screenshot_url,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "resolved": False
            },
            "action_required_reason": "Human verification (CAPTCHA) required to complete application submission."
        })

        # 2. Add Timeline event and AI log
        await application_repo.update_status(
            app_id,
            ApplicationStatus.ACTION_REQUIRED,
            "CAPTCHA Verification Required 🛡️",
            "Automation paused. Human verification required to solve security challenge."
        )
        await application_repo.add_ai_log(
            app_id,
            f"CAPTCHA detected ({captcha_type}). Automation safely paused per security policy.",
            "BrowserWorker",
            confidence=1.0
        )

        # 3. Create high-priority Notification for the user
        await notification_repo.create({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "title": f"Action Required: Security Verification for {app.get('company')}",
            "message": "A security challenge was encountered. Please complete the verification step to resume submission.",
            "type": "captcha",
            "priority": "urgent",
            "is_read": False,
            "action_url": f"/applications/{app_id}",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {"success": True, "status": "paused_for_human_captcha"}

    async def handle_captcha_resolved(self, app_id: str, user_id: str) -> Dict[str, Any]:
        """
        Called when user solves verification and triggers resume.
        """
        app = await application_repo.get_by_id(app_id)
        if not app:
            return {"success": False, "message": "Application not found"}

        # Mark CAPTCHA as resolved
        await application_repo.update(app_id, {
            "status": ApplicationStatus.READY_FOR_REVIEW.value,
            "captcha_context": {
                "detected": False,
                "resolved": True,
                "resolved_at": datetime.now(timezone.utc).isoformat()
            },
            "action_required_reason": None
        })

        await application_repo.update_status(
            app_id,
            ApplicationStatus.READY_FOR_REVIEW,
            "Verification Completed ✅",
            "User successfully solved security verification. Workflow ready to proceed."
        )
        await application_repo.add_ai_log(
            app_id,
            "CAPTCHA solved by candidate. Resuming workflow.",
            "CaptchaHandler",
            confidence=1.0
        )

        return {"success": True, "status": "resumed"}


captcha_handler = CaptchaHandler()
