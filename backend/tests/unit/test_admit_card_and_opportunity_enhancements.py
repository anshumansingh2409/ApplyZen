import pytest
from app.ai.agents.opportunity_agent import opportunity_agent


def test_admit_card_detection():
    # 1. Accenture Admit Card
    subj = "Accenture Recruitment: Admit Card / Hall Ticket for Online Assessment"
    body = """
    Dear Candidate,
    Your Admit Card for Accenture Cognitive and Technical Assessment is now available.
    Test Date: 18th November 2026 at 10:00 AM
    Registration No: ACC2026987
    Please click the link below to access your exam hall ticket and assessment slot:
    https://assessment.accenture.com/login/candidate?slot=18nov
    Best regards,
    Campus Talent Acquisition
    """
    is_admit, data = opportunity_agent.is_admit_card(text=body, subject=subj)
    assert is_admit is True
    assert data["company"] == "Accenture"
    assert "https://assessment.accenture.com" in data["test_url"]
    assert "18th November 2026" in data["exam_date"]

    # 2. Hall Ticket signal
    subj2 = "TCS NQT Hallticket Issued - Slot Booking Confirmation"
    body2 = "Your TCS Hall Ticket has been generated. Login to superset or click here https://tcs.com/hallticket."
    is_admit2, data2 = opportunity_agent.is_admit_card(text=body2, subject=subj2)
    assert is_admit2 is True
    assert data2["company"] == "TCS"

    # 3. Regular opportunity should NOT be flagged as admit card
    subj3 = "New Notice - Registration Link || B.Tech -All Branches - Batch 2027 || KPMG in India"
    body3 = "Apply here https://forms.gle/xyz before 20th November 2026."
    is_admit3, _ = opportunity_agent.is_admit_card(text=body3, subject=subj3)
    assert is_admit3 is False


def test_admit_card_excluded_from_opportunities():
    subj = "Accenture Admit Card / Hall Ticket for Batch 2026"
    body = "Download your admit card at https://accenture.com/exam. Assessment on 20 Nov 2026."
    is_opp, reason = opportunity_agent.is_career_opportunity(text=body, subject=subj, from_addr="recruiter@accenture.com")
    assert is_opp is False
    assert reason == "admit_card"

    # Exact user notice: "Accenture Recruitment Process: Download your Admit Card NOW!"
    user_subj = "Accenture Recruitment Process: Download your Admit Card NOW!"
    user_body = """
    Dear Candidate,
    Congratulations on completing the preliminary registration.
    Please download your Admit Card for the upcoming Accenture National Assessment.
    Slot: 22nd November 2026, 11:00 AM
    Test link: https://assessment.accenture.com/candidate/test
    """
    is_opp2, reason2 = opportunity_agent.is_career_opportunity(text=user_body, subject=user_subj, from_addr="talent@accenture.com")
    assert is_opp2 is False
    assert reason2 == "admit_card"

    is_admit_user, admit_data_user = opportunity_agent.is_admit_card(text=user_body, subject=user_subj)
    assert is_admit_user is True
    assert admit_data_user["company"] == "Accenture"


def test_numeric_deadline_parsing():
    text1 = "Last date to register is 25/11/2026 till 06.00 PM."
    iso1, raw1 = opportunity_agent.parse_deadline(text1)
    assert iso1 is not None
    assert "2026-11-25" in iso1
    assert "25/11/2026" in raw1

    text2 = "Registration deadline: 18-12-2026"
    iso2, raw2 = opportunity_agent.parse_deadline(text2)
    assert iso2 is not None
    assert "2026-12-18" in iso2


@pytest.mark.asyncio
async def test_no_dummy_skills_or_fake_stipend():
    text = """
    Subject: Campus Hiring Drive - Athenian Tech
    From: tpo@campus.edu
    
    Athenian Tech is visiting our campus for hiring fresh talent.
    Role: Associate Consultant
    Apply before 30th November 2026 using https://forms.gle/xyz
    """
    opp = await opportunity_agent.extract_opportunity(text, email_received_at="2026-11-13T10:00:00Z")
    
    # Skills should only contain what was mentioned; no dummy Python/FastAPI/React/SQL injection
    assert opp["skills_required"] == []
    # No fake "Competitive Stipend" injected
    assert opp["stipend"] is None
    # Deadline should not be empty
    assert opp["deadline"] is not None


@pytest.mark.asyncio
async def test_no_deadline_in_email_yields_not_given():
    text = """
    Subject: Campus Hiring Drive - Athenian Tech
    From: tpo@campus.edu
    
    Athenian Tech is visiting our campus for hiring fresh talent.
    Role: Associate Consultant
    Register on link https://forms.gle/xyz
    """
    opp = await opportunity_agent.extract_opportunity(text, email_received_at="2026-11-13T10:00:00Z")
    # When no deadline is given, do not invent one
    assert opp["deadline"] is None
    assert opp["deadline_raw"] == "Not given"


def test_interview_detection_penthara():
    subj1 = "Anshuman Singh | Software Developer Intern |Technical Challenge Round | Galgotias University | Penthara Technologies"
    body1 = """
    Dear Anshuman Singh,
    Congratulations! You have been shortlisted for the Technical Challenge Round for the Software Developer Intern role at Penthara Technologies.
    Date: 29 Oct 2026
    Test link: https://meet.google.com/xyz-penthara-interview
    """
    is_int1, data1 = opportunity_agent.is_interview_invitation(body1, subj1)
    assert is_int1 is True
    assert data1["company"] == "Penthara Technologies"
    assert data1["role"] == "Software Developer Intern"
    assert "Technical Challenge Round" in data1["round_name"]
    assert data1["candidate_name"] == "Anshuman Singh"
    assert "29 Oct 2026" in data1["interview_date"]
    assert data1["is_attended"] is True
    assert data1["status"] == "INTERVIEW"
    assert data1["meeting_url"] == "https://meet.google.com/xyz-penthara-interview"

    # Confirms it is excluded from opportunities (routed to applications)
    is_opp, reason = opportunity_agent.is_career_opportunity(body1, subj1)
    assert is_opp is False
    assert reason == "interview_invitation"

    # Round 2 (05 Nov 2026)
    subj2 = "Anshuman Singh | Software Developer Intern |Technical Challenge Round 2 | Galgotias University | Penthara Technologies"
    body2 = "Dear Anshuman, Scheduled on 05 Nov 2026 for Round 2."
    is_int2, data2 = opportunity_agent.is_interview_invitation(body2, subj2)
    assert is_int2 is True
    assert data2["company"] == "Penthara Technologies"
    assert "Round 2" in data2["round_name"]
    assert "05 Nov 2026" in data2["interview_date"]
    assert data2["is_attended"] is True


def test_interview_detection_micro1_and_outlier():
    # micro1
    subj_micro1 = "micro1: AI Technical Interview Invitation - Software Engineer"
    body_micro1 = "Hi Anshuman, please complete your AI technical screening at https://app.micro1.ai/interview/test-123"
    is_int_m, data_m = opportunity_agent.is_interview_invitation(body_micro1, subj_micro1)
    assert is_int_m is True
    assert data_m["company"] == "micro1"
    assert data_m["role"] == "Software Engineer"
    assert data_m["meeting_url"] == "https://app.micro1.ai/interview/test-123"

    # Outlier
    subj_outlier = "Outlier: Technical Assessment & Coding Challenge"
    body_outlier = "Dear Candidate, Invitation to the coding screening on https://app.outlier.ai/assessment/test"
    is_int_o, data_o = opportunity_agent.is_interview_invitation(body_outlier, subj_outlier)
    assert is_int_o is True
    assert data_o["company"] == "Outlier"
    assert data_o["meeting_url"] == "https://app.outlier.ai/assessment/test"


def test_company_validator_platforms():
    from app.ai.agents.opportunity_agent import CompanyValidator
    assert CompanyValidator.is_valid_company("micro1") is True
    assert CompanyValidator.is_valid_company("Micro1") is True
    assert CompanyValidator.is_valid_company("outlier") is True
    assert CompanyValidator.is_valid_company("Outlier") is True
    assert CompanyValidator.is_valid_company("Penthara Technologies") is True
    assert CompanyValidator.is_valid_company("penthara") is True


