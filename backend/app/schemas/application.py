"""
ApplyZen Application Schemas
Covers full lifecycle state, form fields with confidence scores, AI activity logs, and timelines.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.core.constants import ApplicationStatus, ConfidenceLevel


class FormFieldEntry(BaseModel):
    field_name: str
    field_label: str
    field_type: str = "text"  # text, select, radio, checkbox, textarea, file
    value: Any
    confidence: float = 1.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.HIGH
    source: str = "career_profile"  # career_profile, resume, user_input, default
    is_sensitive: bool = False
    is_approved_by_user: bool = False
    user_edited_value: Optional[Any] = None


class TimelineEvent(BaseModel):
    title: str
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status_tag: Optional[str] = None


class AIActivityLogEntry(BaseModel):
    activity: str
    agent_name: str
    confidence: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None


class CaptchaContext(BaseModel):
    detected: bool = False
    captcha_type: Optional[str] = None  # image, recaptcha, turnstile, hcaptcha
    screenshot_url: Optional[str] = None
    created_at: Optional[datetime] = None
    resolved: bool = False


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    opportunity_id: str
    company: str
    role: str
    application_url: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.DETECTED
    resume_used_id: Optional[str] = None
    resume_used_name: Optional[str] = None
    match_score: int = 0
    form_fields: List[FormFieldEntry] = []
    timeline: List[TimelineEvent] = []
    ai_activity_log: List[AIActivityLogEntry] = []
    captcha_context: Optional[CaptchaContext] = None
    action_required_reason: Optional[str] = None
    deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationReviewSubmit(BaseModel):
    updated_fields: List[FormFieldEntry] = []
    approved: bool = True
