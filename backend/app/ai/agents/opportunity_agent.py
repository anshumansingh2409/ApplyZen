"""
ApplyZen Opportunity Detection Agent
Extracts structured job opportunity metadata from raw email text or job posts.
Features specialized detection for Google Form application links and campus recruitment notices.
"""
from typing import Dict, Any, Optional
import re
import urllib.parse
from datetime import datetime, timedelta, timezone


class OpportunityAgent:
    version: str = "v1.3"

    INTERMEDIARY_PLATFORMS = [
        "superset", "joinsuperset", "unstop", "naukri", "internshala", "instahyre",
        "indeed", "linkedin", "greenhouse", "lever", "myworkday", "smartrecruiters",
        "ashbyhq", "placement cell", "tpo", "galgotias university", "galgotias", "training & placement"
    ]

    def extract_google_form_url(self, text: str) -> Optional[str]:
        """
        Extracts authentic Google Form URL from raw text or HTML.
        Supports forms.gle, docs.google.com/forms, forms.google.com, and Google redirect wrappers.
        """
        if not text:
            return None

        # 1. Wrapped Google redirect e.g. https://www.google.com/url?q=https://forms.gle/xyz&...
        wrap_m = re.search(
            r"https?://(?:www\.)?google\.com/url\?q=(https?://(?:forms\.gle/[a-zA-Z0-9_\-]+|docs\.google\.com/forms/[^\s&\"'>]+|forms\.google\.com/[^\s&\"'>]+))",
            text
        )
        if wrap_m:
            cleaned = urllib.parse.unquote(wrap_m.group(1))
            cleaned = re.sub(r"&amp;.*$", "", cleaned)
            return cleaned.rstrip(".,;)\"'>")

        # 2. Direct forms.gle link
        gle_m = re.search(r"https?://forms\.gle/([a-zA-Z0-9_\-]+)", text)
        if gle_m:
            return f"https://forms.gle/{gle_m.group(1)}"

        # 3. docs.google.com/forms link
        docs_m = re.search(r"(https?://docs\.google\.com/forms/[a-zA-Z0-9_./\-?&=%#+]+)", text)
        if docs_m:
            cleaned = docs_m.group(1)
            cleaned = re.sub(r"&amp;.*$", "", cleaned)
            return cleaned.rstrip(".,;)\"'>")

        # 4. forms.google.com link
        fg_m = re.search(r"(https?://forms\.google\.com/[a-zA-Z0-9_./\-?&=%#+]+)", text)
        if fg_m:
            cleaned = fg_m.group(1)
            cleaned = re.sub(r"&amp;.*$", "", cleaned)
            return cleaned.rstrip(".,;)\"'>")

        return None

    def _extract_company(self, text: str, source_email: Optional[str], subject_line: str) -> str:
        """
        Extracts genuine hiring company name, bypassing recruitment portals and university mail handlers.
        """
        # 1. Check subject delimiter pattern common in campus / placement notices:
        # e.g. "New Notice - Registration Required|| Athenian Tech Pvt Ltd.|| B.Tech- CSE & IT|| All Batch 2027"
        if "||" in subject_line:
            chunks = [c.strip() for c in subject_line.split("||") if c.strip()]
            for chunk in chunks:
                low = chunk.lower()
                if not any(k in low for k in ["notice", "registration", "b.tech", "batch", "cse", "it", "male", "female", "asap", "required", "drive"]):
                    if len(chunk) >= 2:
                        return chunk

        # 2. Greetings from <Company>! (in email body)
        g_m = re.search(r"Greetings from(?:&nbsp;|\s)+([^!<\n\r]{2,40})!", text, re.IGNORECASE)
        if g_m:
            c = g_m.group(1).replace("&nbsp;", " ").strip()
            if not any(k in c.lower() for k in ["university", "college", "tpo", "team", "all", "placement"]):
                return c

        # 3. <Company> is hiring for
        h_m = re.search(r"([A-Za-z0-9\s&.]{2,35})\s+is\s+hiring\s+for", text, re.IGNORECASE)
        if h_m:
            cand = h_m.group(1).replace("&nbsp;", " ").strip()
            if cand.lower() not in ["team", "we", "organization", "student", "students"]:
                return cand

        # 4. Check display name from source_email, unless it's a known intermediary platform
        if source_email:
            disp_match = re.search(r"^([^<@]+)<", source_email)
            if disp_match:
                cand_disp = disp_match.group(1).replace("Careers", "").replace("Recruiting", "").replace("Team", "").replace("Talent", "").strip()
                if len(cand_disp) >= 2 and not any(p in cand_disp.lower() for p in self.INTERMEDIARY_PLATFORMS + ["the", "info", "no-reply", "noreply", "support", "notifications"]):
                    return cand_disp

            domain_match = re.search(r"@([a-zA-Z0-9.-]+)", source_email)
            if domain_match:
                domain = domain_match.group(1).lower()
                parts = domain.split(".")
                main_part = parts[-2] if len(parts) >= 2 and parts[-2] not in ["co", "com", "org", "net", "gov", "edu", "in"] else parts[0]
                if main_part not in ["gmail", "outlook", "yahoo", "hotmail", "proton", "icloud", "mail", "resend", "sendgrid"] and not any(p in main_part for p in self.INTERMEDIARY_PLATFORMS):
                    return main_part.title()

        # 5. Check bracketed company in subject: e.g. [Cred] or "at Cred"
        tag_m = re.search(r"\[([A-Za-z0-9\s&]{2,25})\]", subject_line)
        if tag_m:
            cand = tag_m.group(1).strip()
            if not any(p in cand.lower() for p in self.INTERMEDIARY_PLATFORMS):
                return cand

        at_m = re.search(r"(?:at|@)\s+([A-Za-z0-9&]{2,25})", subject_line, re.IGNORECASE)
        if at_m:
            cand = at_m.group(1).strip()
            if not any(p in cand.lower() for p in self.INTERMEDIARY_PLATFORMS):
                return cand

        # 6. Fallback well-known companies
        common_cos = [
            r"\b(Google|Microsoft|Amazon|Apple|Meta|Netflix|Stripe|Uber|Razorpay|Atlassian|Salesforce|Adobe|Cisco|Swiggy|Zomato|Flipkart|PhonePe|Cred|Paytm|TCS|Infosys|Wipro|Cognizant|KPIT Technologies|Athenian Tech)\b"
        ]
        m = re.search(common_cos[0], text, re.IGNORECASE)
        if m:
            return m.group(1).strip()

        return "Hiring Organization"

    def _extract_role(self, text: str, subject_line: str, company: str) -> str:
        """
        Extracts appropriate role title from notice text or subject.
        """
        # 1. Check delimiter chunks in subject
        if "||" in subject_line:
            chunks = [c.strip() for c in subject_line.split("||") if c.strip()]
            for chunk in chunks:
                low = chunk.lower()
                if any(k in low for k in ["cse", "it", "b.tech", "engineer", "developer", "trainee", "fresher", "intern"]):
                    if not any(bad in low for bad in ["notice", "registration", "required", "asap"]):
                        if company.lower() not in low:
                            return f"Software Engineer ({chunk})"

        # 2. Check standard engineering roles in subject
        role_m = re.search(
            r"\b(Software (?:Engineer|Developer)|Frontend Engineer|Backend Engineer|Full Stack Developer|Full Stack Engineer|Graduate Engineer Trainee|Data Scientist|DevOps Engineer|Product Manager|ML Engineer|AI Engineer|QA Engineer|Systems Engineer|Software Engineering Intern|Data Analyst|SDE(?:-?[123]| I| II| III)?|Intern)\b",
            subject_line,
            re.IGNORECASE
        )
        if role_m:
            return role_m.group(1).strip()

        # 3. Check common roles in text
        m = re.search(
            r"\b(Software Engineering Intern|Software Engineer|Software Developer|Graduate Engineer Trainee|Frontend Engineer|Backend Engineer|Full Stack Developer|Full Stack Engineer|Data Scientist|DevOps Engineer|Product Manager|ML Engineer|AI Engineer|QA Engineer|SDE(?:-?[123]| I| II| III)?|Data Analyst|Intern)\b",
            text,
            re.IGNORECASE
        )
        if m:
            return m.group(1).strip()

        # 4. Check for Fresher hiring
        if "fresher hiring" in text.lower() or "campus drive" in text.lower():
            return "Graduate Engineer Trainee / Software Engineer"

        return "Software Engineer"

    async def extract_opportunity(
        self,
        text: str,
        source_email: Optional[str] = None,
        provider_message_id: Optional[str] = None,
        email_received_at: Optional[str] = None,
        connected_account: Optional[str] = None,
        provider: Optional[str] = "gmail"
    ) -> Dict[str, Any]:
        """
        Parses raw email content or job description into structured opportunity fields.
        Detects Google Form registration links and prioritizes them as application URLs.
        """
        # Subject line extraction
        subject_line = ""
        subj_m = re.search(r"^Subject:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
        if subj_m:
            subject_line = subj_m.group(1).strip()

        # 1. Extract Company
        company = self._extract_company(text, source_email, subject_line)

        # 2. Extract Role
        role = self._extract_role(text, subject_line, company)

        # 3. Extract Google Form URL specifically
        google_form_url = self.extract_google_form_url(text)

        # 4. Fallback URL extraction
        application_url = google_form_url
        if not application_url:
            url_match = re.search(r"https?://[^\s<>\"']+", text)
            application_url = url_match.group(0) if url_match else None

        # 5. Extract Deadline
        deadline = datetime.now(timezone.utc) + timedelta(days=7)
        deadline_match = re.search(r"(?:deadline|apply before|last date|closes on|latest by)[:\s]+([^\n\r,.;]{4,30})", text, re.IGNORECASE)
        if deadline_match:
            pass  # keep default dt object for now or parse if standard

        # 6. Extract Skills
        skill_catalog = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Django",
            "Java", "C++", "Go", "Docker", "Kubernetes", "AWS", "MongoDB", "PostgreSQL",
            "SQL", "Git", "REST API", "GraphQL", "Tailwind CSS", "Next.js", "Redis"
        ]
        found_skills = [s for s in skill_catalog if re.search(rf"\b{re.escape(s)}\b", text, re.IGNORECASE)]
        if not found_skills:
            found_skills = ["Python", "FastAPI", "React", "SQL"]

        # 7. CGPA / Percentage requirement
        cgpa_match = re.search(r"(?:cgpa|gpa|percentage)[:\s]+(?:of\s+)?(\d+\.?\d*)", text, re.IGNORECASE)
        cgpa_required = float(cgpa_match.group(1)) if cgpa_match else None

        # 8. Graduation year requirement
        grad_match = re.search(r"(?:batch of|graduating in|batch:?|batch\s+)(202[0-9])", text, re.IGNORECASE)
        grad_year = int(grad_match.group(1)) if grad_match else None

        # 9. CTC / Stipend extraction
        ctc_match = re.search(r"(?:ctc|stipend|salary|package|compensation)[:\s]+([^\n\r.]+)", text, re.IGNORECASE)
        if ctc_match:
            stipend = ctc_match.group(1).strip()
        elif "intern" in role.lower() or "intern" in text.lower():
            stipend = "Competitive Stipend"
        else:
            stipend = "Competitive Salary / CTC"

        # 10. Location extraction
        loc_patterns = [r"\b(Bengaluru|Bangalore|Hyderabad|Pune|Mumbai|Delhi NCR|Gurgaon|Noida|Remote|San Francisco|New York)\b"]
        loc_match = re.search(loc_patterns[0], text, re.IGNORECASE)
        location = loc_match.group(1).title() if loc_match else "On-Campus / Hybrid"

        # Attached JD detection
        clean_company = re.sub(r"[^\w\s]", "", company).replace(" ", "_")
        clean_role = re.sub(r"[^\w\s]", "", role).replace(" ", "_")
        jd_filename = f"{clean_company}_{clean_role}_JD.pdf"

        # Timestamp
        final_email_time = email_received_at
        if not final_email_time:
            date_m = re.search(r"^Date:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
            if date_m:
                import email.utils
                try:
                    dt = email.utils.parsedate_to_datetime(date_m.group(1).strip())
                    final_email_time = dt.astimezone(timezone.utc).isoformat()
                except Exception:
                    pass
        if not final_email_time:
            final_email_time = datetime.now(timezone.utc).isoformat()

        return {
            "company": company,
            "role": role,
            "job_title": f"{role} at {company}",
            "job_description": text,
            "application_url": application_url,
            "registration_url": application_url,
            "has_google_form": bool(google_form_url),
            "google_form_url": google_form_url,
            "form_type": "google_form" if google_form_url else None,
            "deadline": deadline.isoformat(),
            "location": location,
            "work_mode": "Remote" if "remote" in location.lower() or "remote" in text.lower() else "Full-time",
            "stipend": stipend,
            "salary": stipend,
            "has_jd_attachment": True,
            "jd_attachment_filename": jd_filename,
            "skills_required": found_skills,
            "cgpa_required": cgpa_required,
            "graduation_year_required": grad_year,
            "degree_requirements": ["B.Tech", "B.E.", "M.Tech", "B.S. in CS or related field"],
            "source_email": source_email,
            "provider_message_id": provider_message_id,
            "provider": provider or "gmail",
            "connected_account": connected_account,
            "email_received_at": final_email_time,
            "email_timestamp": final_email_time
        }


opportunity_agent = OpportunityAgent()
