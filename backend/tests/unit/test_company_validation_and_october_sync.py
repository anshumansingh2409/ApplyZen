import pytest
from datetime import datetime, timezone
from app.ai.agents.opportunity_agent import opportunity_agent, CompanyValidator
from app.services.gmail_service import OCTOBER_CUTOFF_DATE

def test_october_cutoff_date():
    assert OCTOBER_CUTOFF_DATE == datetime(2026, 10, 1, 0, 0, 0, tzinfo=timezone.utc)

def test_company_validator_with_real_cases():
    # Valid companies
    assert CompanyValidator.is_valid_company("KPMG in India") is True
    assert CompanyValidator.is_valid_company("KPMG India") is True
    assert CompanyValidator.is_valid_company("HCLTech") is True
    assert CompanyValidator.is_valid_company("KPIT Technologies") is True
    assert CompanyValidator.is_valid_company("Athenian Tech Pvt Ltd.") is True
    assert CompanyValidator.is_valid_company("OnceHub Technologies") is True
    assert CompanyValidator.is_valid_company("TO THE NEW") is True
    assert CompanyValidator.is_valid_company("Trangile Services") is True

    # Invalid junk / non-companies
    assert CompanyValidator.is_valid_company("Link") is False
    assert CompanyValidator.is_valid_company("Important") is False
    assert CompanyValidator.is_valid_company("Notice") is False
    assert CompanyValidator.is_valid_company("Registration Link") is False
    assert CompanyValidator.is_valid_company("Online Assessment") is False
    assert CompanyValidator.is_valid_company("Axis Bank Alerts") is False
    assert CompanyValidator.is_valid_company("Render") is False
    assert CompanyValidator.is_valid_company('"Dr. Ravi Sharma"') is False
    assert CompanyValidator.is_valid_company("1 new update on rewards you could win") is False
    assert CompanyValidator.is_valid_company("1 new update on ISP opportunity") is False
    assert CompanyValidator.is_valid_company("Galgotias University") is False
    assert CompanyValidator.is_valid_company("Training & Placement Cell") is False
    assert CompanyValidator.is_valid_company("Hiring Organization") is False

def test_company_extraction_from_real_email_subjects():
    # 1. KPMG case where previously "Link" or "Important" was extracted
    subj1 = "New Notice - Registration Link || B.Tech -All Branches - Batch 2027 || KPMG in India || Galgotias University"
    comp1 = opportunity_agent._extract_company("Join KPMG drive. Apply here https://forms.gle/xyz", "tpo@galgotias.edu", subj1)
    assert comp1 == "KPMG in India"

    subj2 = "New Notice - Important || Updated Registeration Link & Revised Test Timlines || KPMG India || B.Tech -All Branches (Batch 2027)"
    comp2 = opportunity_agent._extract_company("Updated registration link for KPMG https://forms.gle/xyz", "tpo@galgotias.edu", subj2)
    assert comp2 == "KPMG India"

    # 2. HCLTech case where previously "Online Assessment - HCLTech" was extracted
    subj3 = "Online Assessment - HCLTech"
    comp3 = opportunity_agent._extract_company("Shortlisted candidates for HCLTech https://forms.gle/xyz", "tpo@galgotias.edu", subj3)
    assert comp3 == "HCLTech"

    # 3. Athenian Tech
    subj4 = "New Notice - Registration Required|| Athenian Tech Pvt Ltd.|| B.Tech- CSE & IT|| All Batch 2027"
    comp4 = opportunity_agent._extract_company("Athenian Tech is hiring https://forms.gle/xyz", "tpo@galgotias.edu", subj4)
    assert comp4 == "Athenian Tech Pvt Ltd."

def test_non_opportunity_rejection():
    # Bank alert
    is_opp, reason = opportunity_agent.is_career_opportunity(
        text="INR 2000.00 was credited to your A/c. Login at https://axisbank.com",
        subject="INR 2000.00 was credited to your A/c.",
        from_addr="Axis Bank Alerts <alerts@axis.bank.in>"
    )
    assert is_opp is False

    # Render security advisory
    is_opp, reason = opportunity_agent.is_career_opportunity(
        text="Important advisory on security disclosures. Visit https://render.com/docs",
        subject="Important advisory on recent industry security disclosures",
        from_addr="Render <no-reply@render.com>"
    )
    assert is_opp is False

    # Professor marks submission
    is_opp, reason = opportunity_agent.is_career_opportunity(
        text="Pending SCSE 7th Sem MTE Guide and Examiner Marks Submission before tomorrow.",
        subject="Fwd: Urgent: Pending SCSE 7th Sem MTE Guide and Examiner Marks Submission",
        from_addr='"Dr. Ravi Sharma" <ravisharma@galgotiasuniversity.edu.in>'
    )
    assert is_opp is False

    # ISP rewards email
    is_opp, reason = opportunity_agent.is_career_opportunity(
        text="1 new update on rewards you could win. Check rank at https://internshala.com",
        subject="1 new update on rewards you could win",
        from_addr="ISP Team <student@mail.internshala.com>"
    )
    assert is_opp is False

