"""
ApplyZen Tracker Agent
Classifies post-submission emails into application lifecycle updates (Assessment, Interview, Offer, Rejection).
"""
from typing import Dict, Any, Optional, Tuple
import re
from app.core.constants import ApplicationStatus


class TrackerAgent:
    version: str = "v1.1"

    async def classify_lifecycle_email(self, email_subject: str, email_body: str) -> Tuple[Optional[ApplicationStatus], str, str]:
        """
        Classifies incoming candidate emails.
        Returns: (new_status, timeline_title, timeline_description)
        """
        content = f"{email_subject} {email_body}".lower()

        # 1. Offer
        if any(w in content for w in ["job offer", "offer letter", "pleased to offer", "congratulations on your offer"]):
            return (
                ApplicationStatus.OFFER,
                "Offer Received! 🎉",
                "Official offer notification received via email."
            )

        # 2. Interview
        if any(w in content for w in ["interview invitation", "schedule your interview", "invited for an interview", "round 1 interview", "technical round", "hiring manager discussion"]):
            return (
                ApplicationStatus.INTERVIEW,
                "Interview Scheduled 📅",
                "Received invitation to schedule or attend an interview."
            )

        # 3. Assessment
        if any(w in content for w in ["online assessment", "coding challenge", "hackerrank", "codesignal", "take home test", "assessment link"]):
            return (
                ApplicationStatus.ASSESSMENT,
                "Online Assessment Received 💻",
                "Online technical test or coding evaluation link received."
            )

        # 4. Shortlisted
        if any(w in content for w in ["shortlisted", "next stage", "moving forward with your application"]):
            return (
                ApplicationStatus.SHORTLISTED,
                "Application Shortlisted ✨",
                "Candidate has advanced to the next review round."
            )

        # 5. Rejection
        if any(w in content for w in ["regret to inform", "not moving forward", "other candidates whose qualifications", "decided not to proceed", "position has been filled"]):
            return (
                ApplicationStatus.REJECTED,
                "Application Concluded",
                "Received update that the application will not proceed further."
            )

        return None, "", ""


tracker_agent = TrackerAgent()
