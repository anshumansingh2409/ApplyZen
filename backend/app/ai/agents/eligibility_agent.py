"""
ApplyZen Eligibility Engine Agent
Enforces strict deterministic eligibility checks before any automation starts.
"""
from typing import Dict, Any, Tuple, List
from app.core.constants import EligibilityStatus


class EligibilityAgent:
    version: str = "v1.1"

    async def evaluate_eligibility(
        self,
        opportunity: Dict[str, Any],
        career_profile: Dict[str, Any]
    ) -> Tuple[EligibilityStatus, List[str]]:
        reasons = []
        is_ineligible = False
        requires_review = False

        education = career_profile.get("education", [])
        primary_edu = education[0] if education else {}

        # 1. CGPA Check
        req_cgpa = opportunity.get("cgpa_required")
        user_cgpa = primary_edu.get("cgpa")
        if req_cgpa and user_cgpa is not None:
            if user_cgpa < req_cgpa:
                is_ineligible = True
                reasons.append(f"User CGPA ({user_cgpa}) is below required minimum ({req_cgpa}).")
            else:
                reasons.append(f"CGPA meets criteria: {user_cgpa} >= {req_cgpa}.")
        elif req_cgpa and user_cgpa is None:
            requires_review = True
            reasons.append("CGPA requirement specified but user profile has no CGPA listed.")

        # 2. Graduation Year Check
        req_year = opportunity.get("graduation_year_required")
        user_year = primary_edu.get("graduation_year")
        if req_year and user_year:
            if user_year != req_year:
                is_ineligible = True
                reasons.append(f"Graduation batch mismatch: Required {req_year}, candidate graduating in {user_year}.")
            else:
                reasons.append(f"Graduation batch matches: {user_year}.")

        # 3. Work Authorization Check
        req_auth = opportunity.get("work_authorization_required")
        user_auth = career_profile.get("preferences", {}).get("work_authorization", "")
        if req_auth and not user_auth:
            requires_review = True
            reasons.append("Work authorization check requires user review.")

        # 4. Critical Degree Check
        degree_reqs = opportunity.get("degree_requirements", [])
        user_degree = primary_edu.get("degree", "").lower()
        if degree_reqs and user_degree:
            matches_any_degree = any(dr.lower() in user_degree or user_degree in dr.lower() for dr in degree_reqs)
            if not matches_any_degree:
                reasons.append(f"Degree '{primary_edu.get('degree')}' requires manual verification against {degree_reqs}.")
                requires_review = True

        if is_ineligible:
            return EligibilityStatus.NOT_ELIGIBLE, reasons
        elif requires_review:
            return EligibilityStatus.REVIEW_REQUIRED, reasons
        else:
            reasons.append("All deterministic eligibility criteria satisfied.")
            return EligibilityStatus.ELIGIBLE, reasons


eligibility_agent = EligibilityAgent()
