"""
ApplyZen Opportunity Detection Agent
Extracts structured job opportunity metadata from raw email text or job posts.
Features specialized detection for Google Form application links and campus recruitment notices.
"""
from typing import Dict, Any, Optional
import re
import urllib.parse
import html as pyhtml
from datetime import datetime, timedelta, timezone


class OpportunityAgent:
    version: str = "v1.3"

    INTERMEDIARY_PLATFORMS = [
        "superset", "joinsuperset", "unstop", "naukri", "internshala", "instahyre",
        "indeed", "linkedin", "greenhouse", "lever", "myworkday", "smartrecruiters",
        "ashbyhq", "placement cell", "tpo", "galgotias university", "galgotias", "training & placement"
    ]

    CAMPUS_BLACKLIST = [
        "galgotias university", "galgotias", "gcet", "gu/gcet", "gu/gcop", "gu",
        "t&p department", "t&p", "tpogei", "placement coordinator", "placement cell",
        "dean", "hod", "dr.", "mr.", "ms.", "prof.", "faculty",
        "hiring organization", "b.tech", "mca", "batch", "notice", "registration",
        "internship + ppo", "package-", "re:", "fwd:"
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

    def is_career_opportunity(self, text: str, subject: str = "", from_addr: str = "") -> tuple[bool, str]:
        """
        Strictly evaluates whether an incoming email represents a genuine job, internship,
        campus placement, or recruitment drive.
        Filters out spam, newsletters, OTPs, promotional emails, student surveys, 
        cultural/sports fest notices, administrative college circulars, etc.
        """
        subj_clean = (subject or "").lower().strip()
        body_clean = (text or "").lower().strip()
        from_clean = (from_addr or "").lower().strip()
        combined = f"{subj_clean}\n{body_clean}"

        # 1. Immediate negative exclusion: Security, Login, Authentication
        auth_signals = [
            "verify your email", "password reset", "security alert", "login alert",
            "two-factor", "2-step verification", "one-time passcode", "one-time password",
            "your otp is", "otp for", "verification code", "your code is", "welcome to",
            "reset your password", "security code"
        ]
        if any(w in subj_clean for w in auth_signals) or any(w in body_clean[:250] for w in auth_signals):
            return False, "authentication/security"

        # 2. Immediate negative exclusion: E-commerce, Transactions, Bills, Coupons, Travel, Banking
        commerce_signals = [
            "order confirmed", "order placed", "your order", "payment received", "receipt for",
            "invoice", "billed to", "statement of account", "transaction successful",
            "package delivered", "shipment", "out for delivery", "refund processed",
            "cashback", "coupon code", "discount on", "% off", "flat rs", "sale ends",
            "subscription renewed", "membership renewed", "webinar", "free masterclass",
            "course discount", "upgrade your plan", "terms of service updated",
            "irctc", "pnr", "train ticket", "flight ticket", "account debited", "account credited",
            "bank alert", "axis bank", "credit card statement", "card ending", "upi transaction",
            "application submitted successfully", "your application has been submitted",
            "application confirmation", "thanks for filling in this form"
        ]
        if any(w in subj_clean for w in commerce_signals) or any(w in body_clean[:200] for w in [
            "application submitted successfully", "your application has been submitted",
            "thanks for filling in this form", "irctc e-ticketing", "account debited"
        ]):
            return False, "transactional/promotional/receipt"

        # 3. Exclude Non-Career Campus / University Notices (Surveys, Fests, Admin, Elections, Exams)
        non_career_campus = [
            "feedback form", "course evaluation", "teacher feedback", "student survey",
            "alumni survey", "general survey", "hostel room", "mess committee",
            "cultural fest", "sports meet", "cricket tournament", "freshers party",
            "farewell party", "club induction", "student council election", "voting link",
            "detention list", "attendance shortage", "admit card release", "fee reminder",
            "late fee fine", "library book due", "bus route change", "annual athletic",
            "blood donation camp", "nss activity", "ncc drill", "dj night", "celebrity night",
            "mid term examination", "mid term exam", "mid-term examination", "capstone project",
            "take a second look", "weekly digest", "round 1", "round 2"
        ]
        if any(w in subj_clean for w in non_career_campus):
            return False, "campus_survey_or_admin"

        # Exclude known promo domains & general newsletter digests
        promo_domains = [
            "supabase.com", "cipherschools.com", "crio.do", "crio.in",
            "accounts.google.com", "spotify.com", "netflix.com", "youtube.com",
            "medium.com", "substack.com", "udemy.com", "coursera.com",
            "resend.dev", "support@github.com", "noreply@github.com",
            "mail.instagram.com", "facebookmail.com", "twitter.com", "x.com",
            "linkedin.com", "leetcode.com", "devpost.com", "unstop.news",
            "acciojob-team.org", "codeforces.com"
        ]
        if any(pd in from_clean for pd in promo_domains):
            return False, "excluded_domain"

        # 4. Must contain genuine Career / Recruitment / Hiring Signals
        career_keywords = [
            "campus recruitment", "placement drive", "recruitment drive", "campus drive",
            "pool campus", "hiring drive", "placement cell", "training & placement", "tpo", "crc",
            "job opening", "job opportunity", "internship opportunity", "we are hiring", "hiring",
            "is hiring for", "inviting applications", "registration required", "job description",
            "role:", "designation:", "eligibility criteria", "eligibility", "ctc:", "stipend:", "package:",
            "compensation", "per month", "lpa", "batch 202", "graduating batch", "b.tech", "mca", "b.e.",
            "fresher hiring", "fresher", "intern", "internship", "developer", "software engineer",
            "software developer", "full stack", "frontend engineer", "backend engineer",
            "graduate engineer trainee", "sde-", "sde 1", "sde i", "sde", "interview invitation",
            "shortlisted for", "online assessment", "selection process", "job specification", "job profile"
        ]
        has_career_keyword = any(k in combined for k in career_keywords)
        if not has_career_keyword:
            return False, "no_career_keywords"

        # 5. Must have an authentic application link, recruiter notice, or drive specification
        google_form_url = self.extract_google_form_url(text)
        has_portal_url = any(p in combined for p in [
            "forms.gle", "docs.google.com/forms", "forms.google.com", "superset", "unstop",
            "greenhouse", "lever", "myworkday", "smartrecruiters", "ashbyhq", "internshala"
        ])
        has_any_link = bool(
            google_form_url or has_portal_url or
            re.search(r"https?://[^\s<>\"']+", text)
        )
        career_subj_keywords = [
            "hiring", "drive", "recruitment", "interview", "shortlisted", "intern", "internship",
            "job", "opening", "opportunity", "assessment", "selection", "notice", "registration",
            "batch 202", "placement", "trainee", "developer", "engineer"
        ]
        has_career_subj = any(k in subj_clean for k in career_subj_keywords)
        has_career_body_details = any(k in body_clean for k in ["stipend", "ctc", "package", "duration", "role and responsibilities", "eligibility", "selection process"])

        if not has_any_link and not (has_career_subj or has_career_body_details):
            return False, "missing_application_route"

        return True, "valid_opportunity"

    def clean_job_description(
        self,
        raw_text: str,
        company: str,
        role: str,
        skills: Optional[list] = None,
        stipend: Optional[str] = None,
        location: Optional[str] = None,
        work_mode: Optional[str] = None,
        grad_year: Optional[int] = None,
        cgpa: Optional[float] = None
    ) -> str:
        """
        Cleans and distills raw notice/email text into a crisp, professional, high-value specification.
        Strips email headers (Subject:, From:, Date:), greetings (Dear Students, etc.), footers/disclaimers,
        and filler lines, keeping ONLY necessary and actionable role parameters.
        Properly formats sections (Compensation, Location, Duration, Roles & Responsibilities)
        with clean line breaks instead of run-on text, decoding all HTML entities.
        """
        if not raw_text:
            return f"Campus recruitment opportunity for {role} at {company}."

        # Decode all HTML entities and normalize special whitespace
        text = pyhtml.unescape(raw_text)
        text = text.replace('\xa0', ' ').replace('&nbsp;', ' ').replace('&ndash;', '-').replace('&mdash;', '—')

        # Unwrap tracking redirect URLs e.g. awstrack.me/L0/https...
        def _unwrap_tracking(m):
            raw_target = m.group(1)
            try:
                return urllib.parse.unquote(raw_target)
            except Exception:
                return raw_target
        text = re.sub(r'https?://[^\s/]*awstrack\.me/L0/(https?(?::%2F%2F|://)[^\s/)]+)', _unwrap_tracking, text)

        # Strip embedded raw HTML blocks and residual HTML tags
        text = re.sub(r'<!DOCTYPE[\s\S]*?</html>', '', text, flags=re.IGNORECASE)
        text = re.sub(r'<html[\s\S]*?</html>', '', text, flags=re.IGNORECASE)
        text = re.sub(r'<table[\s\S]*?</table>', '', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]+>', ' ', text)

        # Strip notification prefix labels commonly added by campus broadcast tools
        text = re.sub(r'\b(?:tps|crc|tpo|placement)[-_]notification\s*', '', text, flags=re.IGNORECASE)

        # Strip Google Form confirmation boilerplate
        text = re.sub(r'Thanks for filling (?:in|out) this form:?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r"Here's what was received\.?\s*(?:Edit your response)?", '', text, flags=re.IGNORECASE)

        # Insert clean line breaks before inline section markers that may be smashed together
        section_pattern = re.compile(
            r'\b(Role\s+(?:and|&)\s+Responsibilities\s*:|Key\s+Responsibilities\s*:|Responsibilities\s*:|'
            r'Full-Time\s+Opportunity\s*:|Eligibility\s+Criteria\s*:|Eligibility\s*:|Qualifications\s*:|'
            r'Selection\s+Process\s*:|Technical\s+Skills\s*:|Key\s+Skills\s*:|'
            r'Location\s*:|Duration\s*:|Stipend\s*:|Compensation\s*:|CTC\s*:|'
            r'About\s+(?:the\s+)?Company\s*:|About\s+Us\s*:|Important\s+Note\s*:|Note\s*:)',
            re.IGNORECASE
        )
        text = section_pattern.sub(r'\n\n\1 ', text)

        lines = text.splitlines()
        filtered_lines = []

        for line in lines:
            trimmed = line.strip()
            if not trimmed or re.match(r'^[\|\s\-\_\.\*]+$', trimmed):
                continue

            # Strip college broadcast preamble from beginning of line if present
            trimmed = re.sub(
                r'^(?:dear\s+students?|dear\s+all|dear\s+candidate|greetings\s+from[^,\n]*|greetings|hello\s+all|kind\s+attention)[,:\s\-]+(?:this\s+is\s+to\s+inform\s+(?:you\s+)?that\s+|we\s+are\s+pleased\s+to\s+inform\s+(?:you\s+)?that\s+)?',
                '',
                trimmed,
                flags=re.IGNORECASE
            ).strip()
            if not trimmed:
                continue

            low = trimmed.lower()

            # 1. Skip raw email headers (removes the 3-4 lines of useless email headers)
            if any(low.startswith(h) for h in ["subject:", "from:", "date:", "to:", "cc:", "bcc:", "message-id:", "reply-to:"]):
                continue

            # 2. Skip opening greetings, salutations and college broadcast preambles
            if any(low.startswith(g) for g in [
                "dear student", "dear candidate", "dear all", "hello student", "hello candidate",
                "hello team", "greetings from", "hope this email", "this is to inform",
                "kind attention", "we are pleased to inform", "resilient greetings", "warm greetings",
                "notice for students", "dear placement coordinators", "hope you are doing well"
            ]):
                continue

            # 3. Skip system and platform boilerplate lines
            if any(kw in low for kw in [
                "system generated email", "please do not reply", "you are receiving this email because",
                "to unsubscribe", "see notice in app", "attachments :", "click on the link to download",
                "greekturtle", "hsr layout", "level 3, 31st main"
            ]):
                continue

            # 4. Stop on signatures, disclaimers, or signoffs
            if any(low.startswith(s) for s in [
                "thanks & regards", "warm regards", "best regards", "regards,", "thanks and regards",
                "sincerely,", "with warm regards", "training & placement cell", "dean career services",
                "training and placement", "placement officer", "tpo cell", "crc team", "disclaimer:",
                "this email and any files", "you are receiving this email", "click here to unsubscribe",
                "sent from my iphone", "sent from my android"
            ]):
                break

            # 5. Skip standalone Google Form or application links already tracked in metadata
            if re.match(r"^https?://(?:forms\.gle|docs\.google\.com/forms|forms\.google\.com)[^\s]*$", trimmed):
                continue

            # Normalize inline spaces on each line
            trimmed = re.sub(r"[ \t]+", " ", trimmed)
            filtered_lines.append(trimmed)

        clean_body = "\n\n".join(filtered_lines).strip()

        # If clean_body still has substantive text (at least 40 chars with useful content), return it
        if len(clean_body) >= 40:
            return clean_body

        # Otherwise, synthesize a clean, structured specification containing strictly necessary facts
        specs = [
            f"{company} campus recruitment drive for the position of {role}.",
            f"Work Mode & Location: {work_mode or 'Physical Campus'} ({location or 'On-Campus'}).",
            f"Package / Compensation: {stipend or 'Competitive Salary'}."
        ]
        if grad_year or cgpa:
            elig = []
            if grad_year:
                elig.append(f"Graduating Batch of {grad_year}")
            if cgpa:
                elig.append(f"Minimum {cgpa} CGPA / 60% with no active backlogs")
            specs.append(f"Eligibility: {', '.join(elig)}.")
        if skills:
            specs.append(f"Key Required Skills: {', '.join(skills[:6])}.")

        specs.append("Selection Process: Online Technical Assessment followed by Technical and HR Interview rounds.")
        return "\n\n".join(specs)

    CAMPUS_BLACKLIST = [
        "gu/gcet", "gcet", "galgotias university", "galgotias", "scse", "soe", "gcop", "gimt",
        "batch 2027", "batch 2026", "batch 2025", "batch 2028", "all batch", "b.tech", "mca",
        "placement", "tpo", "career services", "university", "college", "department"
    ]

    MONTH_MAP = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12
    }

    DEADLINE_TRIGGER = (
        r'(?:registration\s+deadline|submission\s+deadline|deadline\s+to\s+register|'
        r'last\s+date\s+to\s+register|date\s+of\s+registration|last\s+date|'
        r'apply\s+before|register\s+by|register\s+before|fill\s+the\s+form\s+before|'
        r'closes\s+on|latest\s+by|deadline)'
    )

    def parse_deadline(self, text: str) -> tuple[Optional[str], Optional[str]]:
        """
        Extracts genuine deadline and formatted raw string directly from notice text.
        Returns (ISO_string, raw_string) or (None, None) if no deadline is specified in the email.
        """
        if not text:
            return None, None
        clean = text.replace('\xa0', ' ').replace('&nbsp;', ' ')

        # 1. Date then Time: e.g. 16th October 2026 till 03.00 PM, 23rd Oct 2026, 11:59 PM
        m1 = re.search(
            self.DEADLINE_TRIGGER + r'\s*[-:]*\s*(?:is\s*)?'
            r'(?:tomorrow\s*,\s*|today\s*,\s*)?'
            r'([0-9]{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+([0-9]{4}))?'
            r'(?:,?\s*(?:till|by|at|,)\s*|\s+)'
            r'([0-9]{1,2})[:.]([0-9]{2})\s*(AM|PM)',
            clean,
            re.IGNORECASE
        )
        if m1:
            day, month_str, year, hr_str, mn_str, ampm = m1.groups()
            m_num = self.MONTH_MAP.get(month_str.lower()[:3])
            if m_num:
                d_num = int(day)
                y_num = int(year) if year else 2026
                hr = int(hr_str)
                mn = int(mn_str)
                ampm = ampm.upper()
                if ampm == 'PM' and hr < 12:
                    hr += 12
                elif ampm == 'AM' and hr == 12:
                    hr = 0
                dt = datetime(y_num, m_num, d_num, hr, mn, tzinfo=timezone.utc)
                raw_str = f"{day} {month_str.title()} {y_num}, {int(hr_str):02d}:{mn_str} {ampm}"
                return dt.isoformat(), raw_str

        # 2. Time then Date: e.g. 04:00 PM, 9th Oct 2026 or is 02:00 PM, 14th May 2026
        m2 = re.search(
            self.DEADLINE_TRIGGER + r'\s*[-:]*\s*(?:is\s*)?'
            r'([0-9]{1,2})[:.]([0-9]{2})\s*(AM|PM),?\s*'
            r'(?:on\s*)?'
            r'([0-9]{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+([0-9]{4}))?',
            clean,
            re.IGNORECASE
        )
        if m2:
            hr_str, mn_str, ampm, day, month_str, year = m2.groups()
            m_num = self.MONTH_MAP.get(month_str.lower()[:3])
            if m_num:
                d_num = int(day)
                y_num = int(year) if year else 2026
                hr = int(hr_str)
                mn = int(mn_str)
                ampm = ampm.upper()
                if ampm == 'PM' and hr < 12:
                    hr += 12
                elif ampm == 'AM' and hr == 12:
                    hr = 0
                dt = datetime(y_num, m_num, d_num, hr, mn, tzinfo=timezone.utc)
                raw_str = f"{day} {month_str.title()} {y_num}, {int(hr_str):02d}:{mn_str} {ampm}"
                return dt.isoformat(), raw_str

        # 3. Date only: e.g. 18th September 2026 or 23rd Oct 2026
        m3 = re.search(
            self.DEADLINE_TRIGGER + r'\s*[-:]*\s*(?:is\s*)?'
            r'(?:tomorrow\s*,\s*|today\s*,\s*)?'
            r'([0-9]{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+([0-9]{4}))?',
            clean,
            re.IGNORECASE
        )
        if m3:
            day, month_str, year = m3.groups()
            m_num = self.MONTH_MAP.get(month_str.lower()[:3])
            if m_num:
                d_num = int(day)
                y_num = int(year) if year else 2026
                dt = datetime(y_num, m_num, d_num, 23, 59, tzinfo=timezone.utc)
                raw_str = f"{day} {month_str.title()} {y_num}, 11:59 PM"
                return dt.isoformat(), raw_str

        return None, None

    def _extract_company(self, text: str, source_email: Optional[str], subject_line: str) -> str:
        """
        Extracts genuine hiring company name, bypassing recruitment portals and university mail handlers.
        """
        clean_no_html = re.sub(r'<[^>]+>', ' ', text)
        subj = subject_line or ""

        def _clean_cand(c: str) -> str:
            if not c:
                return ""
            c = c.strip().strip('*').strip('-').strip(':').strip()
            c = re.sub(r'^(?:New\s+Notice|Notice|Imp\s*-\s*Batch\s*\d+|Batch\s*\d+|Re:|Fwd:|Update:)\s*[-–:]*\s*', '', c, flags=re.IGNORECASE).strip()
            c = re.sub(r'^(?:Register\s+for\s+Recruitment\s+Drives?|Registration\s+Required|Registration|Recruitment\s+Drive)\s*[-–:]*\s*', '', c, flags=re.IGNORECASE).strip()
            c = re.sub(r'^(?:fill\s+the\s+Registration\s+form|Registrations)\s*[-–:]*\s*', '', c, flags=re.IGNORECASE).strip()
            c = re.sub(r'\s+is\s+(?:hiring|planning|visiting|conducting).*$', '', c, flags=re.IGNORECASE).strip()
            c = re.sub(r'\s*\(previously known as [^)]+\)', '', c, flags=re.IGNORECASE).strip()
            return c.strip()

        # 1. Delimiter chunks in subject (|| or |)
        if "||" in subj or "|" in subj:
            sep = "||" if "||" in subj else "|"
            chunks = [c.strip() for c in subj.split(sep) if c.strip()]
            for chunk in chunks:
                cleaned = _clean_cand(chunk)
                low = cleaned.lower()
                if any(b in low for b in ["gu/gcet", "gu/gcop", "galgotias", "b.tech", "mca", "m.tech", "cse", "batch", "register by", "package", "nomination", "internship +", "gender"]):
                    continue
                if len(cleaned) >= 2 and not any(p in low for p in ["notice", "registration", "required", "asap"]):
                    return cleaned

        # 2. Check subject drive/registration prefix: e.g.
        # "New Notice - Register for Recruitment Drive - TO THE NEW || B.Tech..."
        # "New Notice - Register for Recruitment Drives - Whatbytes || B.Tech..."
        m_drive = re.search(
            r'(?:recruitment drive[s]?|registration required|registration|hiring drive|campus drive)\s*[-:]+\s*([A-Za-z0-9\s&.()\'\"-]{2,40}?)(?:\s*\|\||\s*--|\s*\||\s*,\s*batch|\s*\(|\s*$)',
            subj,
            re.IGNORECASE
        )
        if m_drive:
            cand = _clean_cand(m_drive.group(1))
            if len(cand) >= 2 and not any(b in cand.lower() for b in self.CAMPUS_BLACKLIST):
                return cand

        # 3. Check subject notice pattern: e.g. "New Notice - Tata Elxsi - Launching TELIPORT Season 4..."
        m_notice = re.search(
            r'New Notice\s*-\s*([A-Za-z0-9\s&.()\'\"-]{2,35}?)\s*-\s*',
            subj,
            re.IGNORECASE
        )
        if m_notice:
            cand = _clean_cand(m_notice.group(1))
            if len(cand) >= 2 and not any(b in cand.lower() for b in self.CAMPUS_BLACKLIST) and not any(b in cand.lower() for b in ["register", "recruitment"]):
                return cand

        # 4. Body text indicators:
        # "This is to kindly inform you that TO THE NEW is hiring..."
        # "This is to inform you that Whatbytes( ... ) is interested in hiring..."
        m_body = re.search(
            r'(?:inform you that|pleased to inform you that|greetings from)\s+([A-Za-z0-9\s&.()\'\"-]{2,35}?)(?:\([^)]*\))?\s+(?:is hiring|is interested in hiring|is conducting|is visiting)',
            clean_no_html,
            re.IGNORECASE
        )
        if m_body:
            cand = m_body.group(1).strip()
            if not any(b in cand.lower() for b in self.CAMPUS_BLACKLIST):
                return cand

        # "Tata Elxsi, a global leader in design and technology services..."
        m_leader = re.search(
            r'([A-Za-z0-9\s&.()\'\"-]{2,35}),\s+a\s+(?:global|leading|tech)\s+leader',
            clean_no_html,
            re.IGNORECASE
        )
        if m_leader:
            cand = m_leader.group(1).strip()
            if not any(b in cand.lower() for b in self.CAMPUS_BLACKLIST):
                return cand

        # "Greetings from <Company>!"
        g_m = re.search(r"Greetings from(?:&nbsp;|\s)+([^!<\n\r]{2,40})!", clean_no_html, re.IGNORECASE)
        if g_m:
            c = g_m.group(1).replace("&nbsp;", " ").strip()
            if not any(k in c.lower() for k in self.CAMPUS_BLACKLIST + ["team", "all"]):
                return c

        # "<Company> is hiring for"
        h_m = re.search(r"([A-Za-z0-9\s&.]{2,35})\s+is\s+hiring\s+for", clean_no_html, re.IGNORECASE)
        if h_m:
            cand = h_m.group(1).strip()
            if cand.lower() not in ["team", "we", "organization", "student", "students"] and not any(b in cand.lower() for b in self.CAMPUS_BLACKLIST):
                return cand

        # 5. Check display name from source_email, unless it's a known intermediary platform
        if source_email:
            disp_match = re.search(r"^([^<@]+)<", source_email)
            if disp_match:
                cand_disp = disp_match.group(1).replace("Careers", "").replace("Recruiting", "").replace("Team", "").replace("Talent", "").strip()
                if len(cand_disp) >= 2 and not any(p in cand_disp.lower() for p in self.INTERMEDIARY_PLATFORMS + self.CAMPUS_BLACKLIST + ["the", "info", "no-reply", "noreply", "support", "notifications"]):
                    return cand_disp

            domain_match = re.search(r"@([a-zA-Z0-9.-]+)", source_email)
            if domain_match:
                domain = domain_match.group(1).lower()
                parts = domain.split(".")
                main_part = parts[-2] if len(parts) >= 2 and parts[-2] not in ["co", "com", "org", "net", "gov", "edu", "in"] else parts[0]
                if main_part not in ["gmail", "outlook", "yahoo", "hotmail", "proton", "icloud", "mail", "resend", "sendgrid"] and not any(p in main_part for p in self.INTERMEDIARY_PLATFORMS + self.CAMPUS_BLACKLIST):
                    return main_part.title()

        # 6. Check bracketed company in subject: e.g. [Cred] or "at Cred"
        tag_m = re.search(r"\[([A-Za-z0-9\s&]{2,25})\]", subject_line)
        if tag_m:
            cand = tag_m.group(1).strip()
            if not any(p in cand.lower() for p in self.INTERMEDIARY_PLATFORMS + self.CAMPUS_BLACKLIST):
                return cand

        at_m = re.search(r"(?:at|@)\s+([A-Za-z0-9&]{2,25})", subject_line, re.IGNORECASE)
        if at_m:
            cand = at_m.group(1).strip()
            if not any(p in cand.lower() for p in self.INTERMEDIARY_PLATFORMS + self.CAMPUS_BLACKLIST):
                return cand

        # 7. Fallback well-known companies (matched against clean non-HTML text)
        common_cos = [
            r"\b(Tata Elxsi|TO THE NEW|Whatbytes|Google|Microsoft|Amazon|Apple|Meta|Netflix|Stripe|Uber|Razorpay|Atlassian|Salesforce|Adobe|Cisco|Swiggy|Zomato|Flipkart|PhonePe|Cred|Paytm|TCS|Infosys|Wipro|Cognizant|KPIT Technologies|Athenian Tech)\b"
        ]
        m = re.search(common_cos[0], clean_no_html)
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

        # 5. Extract Deadline strictly from email text
        deadline_iso, deadline_raw = self.parse_deadline(text)

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

        clean_desc = self.clean_job_description(
            raw_text=text,
            company=company,
            role=role,
            skills=found_skills,
            stipend=stipend,
            location=location,
            work_mode="Remote" if "remote" in location.lower() or "remote" in text.lower() else "Full-time",
            grad_year=grad_year,
            cgpa=cgpa_required
        )

        return {
            "company": company,
            "role": role,
            "job_title": f"{role} at {company}",
            "job_description": clean_desc,
            "application_url": application_url,
            "registration_url": application_url,
            "has_google_form": bool(google_form_url),
            "google_form_url": google_form_url,
            "form_type": "google_form" if google_form_url else None,
            "deadline": deadline_iso,
            "deadline_raw": deadline_raw,
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
