"""
ApplyZen Career Profile & Knowledge Base Schemas
Ground truth for Zero-Hallucination AI decision making.
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from app.core.constants import ApplicationMode, FieldPolicy


class Education(BaseModel):
    institution: str
    degree: str  # "10th", "12th", "Undergraduate", "Postgraduate"
    board_or_university: Optional[str] = None
    major: Optional[str] = ""
    start_month: Optional[str] = None
    start_year: Optional[int] = None
    end_month: Optional[str] = None
    end_year: Optional[int] = None
    graduation_year: Optional[int] = 2025
    score_type: Optional[str] = "cgpa"  # "percentage" or "cgpa"
    percentage: Optional[float] = None
    cgpa: Optional[float] = None
    active_backlogs: Optional[int] = 0
    total_backlogs: Optional[int] = 0


class GapYearInfo(BaseModel):
    has_gap: bool = False
    gap_years: Optional[float] = 0
    reason: Optional[str] = ""


class SkillItem(BaseModel):
    name: str
    category: str = "Technical"  # "Technical", "Soft Skill", "Tool", "Language"
    level: str = "Intermediate"  # "Beginner", "Intermediate", "Advanced", "Expert"


class LanguageItem(BaseModel):
    name: str = "English"
    proficiency: str = "Fluent"  # "Native", "Fluent", "Professional", "Intermediate", "Basic"


class ProjectItem(BaseModel):
    title: str
    description: str
    technologies: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None


class ExperienceItem(BaseModel):
    company: str
    role: str
    employment_type: str = "Full-time"  # "Full-time", "Internship", "Contract", "Part-time"
    location: Optional[str] = None
    is_current: bool = False
    start_date: Optional[str] = None
    end_date: Optional[str] = "Present"
    description: Optional[str] = ""
    skills_used: List[str] = []


class CertificationItem(BaseModel):
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None


class WorkAuthorization(BaseModel):
    authorized_in_target_country: bool = True
    requires_sponsorship: bool = False
    visa_status: str = "Citizen / Permanent Resident"
    notice_period_days: int = 15
    serving_notice: bool = False
    last_working_day: Optional[str] = None
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    currency: str = "INR"


class EEODisclosures(BaseModel):
    gender: Optional[str] = "Prefer not to say"
    veteran_status: Optional[str] = "I am not a protected veteran"
    disability_status: Optional[str] = "No, I do not have a disability"
    ethnicity: Optional[str] = "Decline to self-identify"


class Preferences(BaseModel):
    desired_roles: List[str] = ["Software Engineer", "Full Stack Developer"]
    preferred_locations: List[str] = ["Remote", "Bangalore", "San Francisco"]
    work_modes: List[str] = ["Remote", "Hybrid"]
    will_relocate: bool = True
    minimum_expected_salary: Optional[float] = None
    work_authorization: str = "Authorized to work in country of application"
    notice_period_days: int = 15


class AutomationPolicySchema(BaseModel):
    application_mode: ApplicationMode = ApplicationMode.APPROVAL_MODE
    salary_policy: FieldPolicy = FieldPolicy.ASK_USER
    relocation_policy: FieldPolicy = FieldPolicy.ALLOW
    legal_declaration_policy: FieldPolicy = FieldPolicy.ASK_USER
    sensitive_info_policy: FieldPolicy = FieldPolicy.ASK_USER
    unknown_info_policy: FieldPolicy = FieldPolicy.ASK_USER
    auto_submit_deadline_buffer_hours: int = 6


class CareerProfileSchema(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    legal_name: Optional[str] = None
    phone: Optional[str] = None
    alt_phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = "Indian"
    roll_number: Optional[str] = None
    tenth_percentage: Optional[float] = None
    twelfth_percentage: Optional[float] = None
    
    # Contact & Identity
    avatar_url: Optional[str] = None
    phone_country_code: Optional[str] = "+91"
    alt_phone_country_code: Optional[str] = "+91"
    
    # Address details
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = "India"
    
    same_as_permanent: bool = True
    permanent_street_address: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_postal_code: Optional[str] = None
    permanent_country: Optional[str] = "India"
    permanent_address: Optional[str] = None
    
    # Online presence
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    twitter_url: Optional[str] = None
    bio: Optional[str] = None
    
    # Form details
    education: List[Education] = []
    skills: List[SkillItem] = []
    languages: List[LanguageItem] = []
    projects: List[ProjectItem] = []
    experience: List[ExperienceItem] = []
    certifications: List[CertificationItem] = []
    work_authorization: WorkAuthorization = Field(default_factory=WorkAuthorization)
    eeo_disclosures: EEODisclosures = Field(default_factory=EEODisclosures)
    preferences: Preferences = Field(default_factory=Preferences)
    gap_year: GapYearInfo = Field(default_factory=GapYearInfo)
    automation_policy: AutomationPolicySchema = Field(default_factory=AutomationPolicySchema)
