"""
ApplyZen AI Confidence & Validation Engine
Calculates confidence levels and enforces zero-hallucination policies.
"""
from typing import Dict, Any, Tuple
from app.core.constants import ConfidenceLevel, FieldPolicy


def calculate_confidence(value: Any, source: str) -> Tuple[float, ConfidenceLevel]:
    """
    Computes confidence score based on verified data sources.
    - career_profile: 0.98 (High)
    - resume: 0.88 (High)
    - user_input: 1.0 (High)
    - inferred/heuristics: 0.65 (Medium)
    - unknown: 0.30 (Low)
    """
    if source == "user_input":
        return 1.0, ConfidenceLevel.HIGH
    elif source == "career_profile":
        return 0.98, ConfidenceLevel.HIGH
    elif source == "resume":
        return 0.88, ConfidenceLevel.HIGH
    elif source == "inferred":
        return 0.65, ConfidenceLevel.MEDIUM
    else:
        return 0.35, ConfidenceLevel.LOW


def check_field_policy(field_name: str, policy_settings: Dict[str, Any]) -> FieldPolicy:
    """
    Evaluates field sensitivity against user's automation policy.
    """
    field_lower = field_name.lower()
    
    if any(k in field_lower for k in ["salary", "compensation", "ctc", "expected_salary"]):
        return FieldPolicy(policy_settings.get("salary_policy", FieldPolicy.ASK_USER.value))
    elif any(k in field_lower for k in ["relocate", "relocation"]):
        return FieldPolicy(policy_settings.get("relocation_policy", FieldPolicy.ALLOW.value))
    elif any(k in field_lower for k in ["legal", "felony", "criminal", "declaration", "consent", "signature"]):
        return FieldPolicy(policy_settings.get("legal_declaration_policy", FieldPolicy.ASK_USER.value))
    elif any(k in field_lower for k in ["ssn", "passport", "visa", "disability", "veteran", "gender", "race"]):
        return FieldPolicy(policy_settings.get("sensitive_info_policy", FieldPolicy.ASK_USER.value))
    
    return FieldPolicy.ALLOW
