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

