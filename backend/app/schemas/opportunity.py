"""
ApplyZen Opportunity Schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.constants import EligibilityStatus


class OpportunityBase(BaseModel):
    company: str
    role: str
    job_title: Optional[str] = None
    job_description: str
    registration_url: Optional[str] = None
    application_url: Optional[str] = None
    job_id: Optional[str] = None
    deadline: Optional[datetime] = None
    location: Optional[str] = "Remote"
    work_mode: Optional[str] = "Full-time"  # Full-time, Internship, Contract
    salary: Optional[str] = None
    stipend: Optional[str] = None
    ppo_offered: Optional[bool] = None
    degree_requirements: List[str] = []
    cgpa_required: Optional[float] = None
    graduation_year_required: Optional[int] = None
    skills_required: List[str] = []
    experience_required: Optional[str] = None
    assessment_details: Optional[str] = None
    interview_details: Optional[str] = None
    source_email: Optional[str] = None
    connected_account: Optional[str] = None
    provider: str = "manual"  # gmail, outlook, manual
    provider_message_id: Optional[str] = None
    has_google_form: Optional[bool] = False
    google_form_url: Optional[str] = None
    form_type: Optional[str] = None
    email_timestamp: Optional[datetime] = None
    email_received_at: Optional[datetime] = None


class OpportunityCreate(OpportunityBase):
    pass


class OpportunityResponse(OpportunityBase):
    id: str
    user_id: str
    eligibility_status: EligibilityStatus = EligibilityStatus.REVIEW_REQUIRED
    eligibility_reasons: List[str] = []
    match_score: Optional[int] = None
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    selected_resume_id: Optional[str] = None
    selected_resume_name: Optional[str] = None
    application_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
