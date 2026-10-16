"""
ApplyZen Core Constants
Central definition of application lifecycle statuses, confidence levels, field policies, and system defaults.
"""
from enum import Enum


class ApplicationStatus(str, Enum):
    DETECTED = "DETECTED"
    CLASSIFIED = "CLASSIFIED"
    ELIGIBILITY_CHECK = "ELIGIBILITY_CHECK"
    JD_ANALYZED = "JD_ANALYZED"
    RESUME_SELECTED = "RESUME_SELECTED"
    APPLICATION_STARTED = "APPLICATION_STARTED"
    FORM_ANALYZED = "FORM_ANALYZED"
    FORM_FILLED = "FORM_FILLED"
    VALIDATION = "VALIDATION"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    APPROVED = "APPROVED"
    AUTO_READY = "AUTO_READY"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ASSESSMENT = "ASSESSMENT"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
    EXPIRED = "EXPIRED"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    FAILED = "FAILED"


class EligibilityStatus(str, Enum):
    ELIGIBLE = "ELIGIBLE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"       # >= 0.85
    MEDIUM = "MEDIUM"   # 0.60 - 0.84
    LOW = "LOW"         # < 0.60


class FieldPolicy(str, Enum):
    ALLOW = "ALLOW"
    ASK_USER = "ASK_USER"
    BLOCK = "BLOCK"


class ApplicationMode(str, Enum):
    APPROVAL_MODE = "APPROVAL_MODE"
    AUTOMATIC_MODE = "AUTOMATIC_MODE"


class DeadlineStatus(str, Enum):
    NO_DEADLINE = "NO_DEADLINE"
    DEADLINE_FAR = "DEADLINE_FAR"
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING"
    URGENT = "URGENT"
    EXPIRED = "EXPIRED"


class SupportStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_FOR_USER = "WAITING_FOR_USER"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


# RabbitMQ Queue Definitions
QUEUE_EMAIL_PROCESSING = "email.processing"
QUEUE_OPPORTUNITY_PROCESSING = "opportunity.processing"
QUEUE_JD_ANALYSIS = "jd.analysis"
QUEUE_RESUME_MATCHING = "resume.matching"
QUEUE_APPLICATION_AUTOMATION = "application.automation"
QUEUE_BROWSER_AUTOMATION = "browser.automation"
QUEUE_APPLICATION_TRACKING = "application.tracking"
QUEUE_NOTIFICATION_PROCESSING = "notification.processing"
QUEUE_AI_ASSISTANT = "ai.assistant"
