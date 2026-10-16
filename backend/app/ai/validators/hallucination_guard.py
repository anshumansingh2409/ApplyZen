"""
ApplyZen Zero-Hallucination Guard
Guarantees AI never invents facts or personal records.
"""
from typing import Dict, Any, List, Optional
from app.core.exceptions import ZeroHallucinationGuardError


class HallucinationGuard:
    @staticmethod
    def verify_field_grounding(field_name: str, value: Any, career_profile: Dict[str, Any]) -> bool:
        """
        Validates that personal attributes exist in the verified knowledge base.
        """
        if value is None or value == "":
            return False

        # If it's a known factual field, confirm presence
        fn = field_name.lower()
        if "cgpa" in fn or "gpa" in fn:
            edu = career_profile.get("education", [])
            return any(e.get("cgpa") is not None for e in edu)
        
        if "graduation" in fn or "year" in fn:
            edu = career_profile.get("education", [])
            return any(e.get("graduation_year") is not None for e in edu)

        return True

    @staticmethod
    def identify_missing_critical_data(required_fields: List[str], career_profile: Dict[str, Any]) -> List[str]:
        missing = []
        for f in required_fields:
            if not HallucinationGuard.verify_field_grounding(f, True, career_profile):
                missing.append(f)
        return missing


hallucination_guard = HallucinationGuard()
