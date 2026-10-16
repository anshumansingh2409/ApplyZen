"""
ApplyZen Resume Schemas
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ResumeBase(BaseModel):
    title: str
    file_name: str
    file_url: str
    version_label: str = "v1.0"
    is_preferred: bool = False
    skills_extracted: List[str] = []
    summary: Optional[str] = None


class ResumeCreate(ResumeBase):
    pass


class ResumeResponse(ResumeBase):
    id: str
    user_id: str
    uploaded_at: datetime
    times_used: int = 0

    model_config = ConfigDict(from_attributes=True)


class ResumeMatchResult(BaseModel):
    resume_id: str
    resume_name: str
    match_percentage: int
    matching_skills: List[str]
    missing_skills: List[str]
    recommendation_reason: str
