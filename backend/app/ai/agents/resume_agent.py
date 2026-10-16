"""
ApplyZen Resume Matching Agent
Evaluates user's uploaded resumes against opportunity requirements, calculates match scores, and recommends the best version.
"""
from typing import List, Dict, Any, Tuple


class ResumeAgent:
    version: str = "v1.2"

    async def match_resumes(
        self,
        opportunity: Dict[str, Any],
        career_profile: Dict[str, Any],
        resumes: List[Dict[str, Any]]
    ) -> Tuple[Dict[str, Any], int, List[str], List[str]]:
        """
        Calculates match score between resumes and opportunity JD requirements.
        Returns: (best_resume, match_score, matching_skills, missing_skills)
        """
        required_skills = opportunity.get("skills_required", [])
        if not required_skills:
            required_skills = ["Software Engineering", "Problem Solving", "Communication"]

        # User's known profile skills
        profile_skills = [s.get("name") for s in career_profile.get("skills", [])]
        user_all_skills = set(s.lower() for s in profile_skills if s)

        best_resume = None
        highest_score = -1
        best_matching = []
        best_missing = []

        # If user has uploaded resumes, score each resume
        if resumes:
            for r in resumes:
                resume_skills = set(s.lower() for s in r.get("skills_extracted", []))
                combined_skills = user_all_skills.union(resume_skills)

                matching = [s for s in required_skills if s.lower() in combined_skills]
                missing = [s for s in required_skills if s.lower() not in combined_skills]

                # Base score: ratio of matching skills
                match_pct = int((len(matching) / max(len(required_skills), 1)) * 100)
                # Boost if preferred
                if r.get("is_preferred"):
                    match_pct = min(100, match_pct + 5)

                if match_pct > highest_score:
                    highest_score = match_pct
                    best_resume = r
                    best_matching = matching
                    best_missing = missing
        else:
            # Score against Career Profile alone
            matching = [s for s in required_skills if s.lower() in user_all_skills]
            missing = [s for s in required_skills if s.lower() not in user_all_skills]
            highest_score = int((len(matching) / max(len(required_skills), 1)) * 100)
            best_matching = matching
            best_missing = missing
            best_resume = {
                "_id": "profile_default",
                "title": "Default Career Profile",
                "file_name": "Career_Profile_Auto_Generated.pdf",
                "version_label": "v1.0"
            }

        return best_resume, max(highest_score, 60), best_matching, best_missing


resume_agent = ResumeAgent()
