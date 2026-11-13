"""
ApplyZen Applications Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Body
from app.auth.dependencies import get_current_user
from app.database.repositories.application_repository import application_repo
from app.schemas.application import ApplicationReviewSubmit
from app.services.application_service import application_service
from app.automation.handlers.captcha_handler import captcha_handler
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/applications", tags=["Applications"])


from datetime import datetime, timezone

@router.get("")
async def list_applications(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    user_email = current_user.get("email")

    apps = await application_repo.list_by_user(user_id, email=user_email, status=status)
    existing_companies = { (a.get("company") or "").lower() for a in apps }
    penthara_rounds = [a for a in apps if "penthara" in (a.get("company") or "").lower()]

    # Ensure Penthara Technologies (29 Oct Round 1 & 05 Nov Round 2 - Attended/Completed)
    if len(penthara_rounds) < 2:
        default_penthara = [
            {
                "_id": f"penthara_round1_{user_id}",
                "user_id": user_id,
                "user_email": user_email,
                "company": "Penthara Technologies",
                "role": "Software Developer Intern",
                "round_name": "Technical Challenge Round 1",
                "status": "INTERVIEW",
                "is_interview": True,
                "is_attended": True,
                "applied_date": "29 Oct 2026",
                "match_score": 96,
                "campus": "Galgotias University",
                "source": "Galgotias University Campus Drive",
                "subject": "Anshuman Singh | Software Developer Intern |Technical Challenge Round | Galgotias University | Penthara Technologies",
                "timeline": [
                    {
                        "title": "🎙️ Technical Challenge Round 1 Completed",
                        "description": "Technical challenge coding test conducted on 29 Oct 2026 for Software Developer Intern. Attended & submitted.",
                        "status_tag": "INTERVIEW",
                        "timestamp": "2026-10-29T10:00:00+00:00"
                    }
                ],
                "created_at": "2026-10-29T10:00:00+00:00",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": f"penthara_round2_{user_id}",
                "user_id": user_id,
                "user_email": user_email,
                "company": "Penthara Technologies",
                "role": "Software Developer Intern",
                "round_name": "Technical Challenge Round 2",
                "status": "INTERVIEW",
                "is_interview": True,
                "is_attended": True,
                "applied_date": "05 Nov 2026",
                "match_score": 96,
                "campus": "Galgotias University",
                "source": "Galgotias University Campus Drive",
                "subject": "Anshuman Singh | Software Developer Intern |Technical Challenge Round 2 | Galgotias University | Penthara Technologies",
                "timeline": [
                    {
                        "title": "🎙️ Technical Challenge Round 2 Completed",
                        "description": "Second round technical challenge and interview conducted on 05 Nov 2026 for Software Developer Intern. Attended & submitted.",
                        "status_tag": "INTERVIEW",
                        "timestamp": "2026-11-05T14:30:00+00:00"
                    }
                ],
                "created_at": "2026-11-05T14:30:00+00:00",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for p_app in default_penthara:
            if not any(a["_id"] == p_app["_id"] for a in apps):
                await application_repo.create(p_app)
                apps.append(p_app)

    # Ensure micro1 AI Technical Interview
    if not any("micro1" in (a.get("company") or "").lower() for a in apps):
        micro1_app = {
            "_id": f"micro1_ai_interview_{user_id}",
            "user_id": user_id,
            "user_email": user_email,
            "company": "micro1",
            "role": "AI Software Engineer",
            "round_name": "AI Technical Screening & Live Coding",
            "status": "INTERVIEW",
            "is_interview": True,
            "is_attended": False,
            "applied_date": "10 Nov 2026",
            "match_score": 94,
            "application_url": "https://app.micro1.ai/interview/candidate-screening",
            "google_form_url": "https://app.micro1.ai/interview/candidate-screening",
            "timeline": [
                {
                    "title": "🎙️ micro1 AI Technical Interview Scheduled",
                    "description": "AI-powered technical screening and system design assessment.",
                    "status_tag": "INTERVIEW",
                    "timestamp": "2026-11-10T11:00:00+00:00"
                }
            ],
            "created_at": "2026-11-10T11:00:00+00:00",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await application_repo.create(micro1_app)
        apps.append(micro1_app)

    # Ensure Outlier Technical Assessment
    if not any("outlier" in (a.get("company") or "").lower() for a in apps):
        outlier_app = {
            "_id": f"outlier_assessment_{user_id}",
            "user_id": user_id,
            "user_email": user_email,
            "company": "Outlier",
            "role": "AI Specialist / Python Developer",
            "round_name": "Technical Screening & Code Review Assessment",
            "status": "ASSESSMENT",
            "is_interview": True,
            "is_attended": False,
            "applied_date": "12 Nov 2026",
            "match_score": 91,
            "application_url": "https://app.outlier.ai/assessment/technical-screening",
            "google_form_url": "https://app.outlier.ai/assessment/technical-screening",
            "timeline": [
                {
                    "title": "📝 Technical Screening Assessment Issued",
                    "description": "Python algorithms and code evaluation challenge on Outlier platform.",
                    "status_tag": "ASSESSMENT",
                    "timestamp": "2026-11-12T09:00:00+00:00"
                }
            ],
            "created_at": "2026-11-12T09:00:00+00:00",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await application_repo.create(outlier_app)
        apps.append(outlier_app)

    for a in apps:
        a["id"] = a["_id"]

    if status:
        if status == "INTERVIEW":
            apps = [a for a in apps if a.get("status") in ["INTERVIEW", "ASSESSMENT", "SHORTLISTED"]]
        else:
            apps = [a for a in apps if a.get("status") == status]

    return apps


@router.get("/{application_id}")
async def get_application(application_id: str, current_user: dict = Depends(get_current_user)):
    app = await application_repo.get_by_id(application_id)
    if not app or (app.get("user_id") != current_user["_id"] and app.get("user_email") != current_user.get("email")):
        raise NotFoundError("Application not found")
    app["id"] = app["_id"]
    return app


@router.put("/{application_id}")
async def update_application(
    application_id: str,
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Allows user to review, edit, or add custom fields and notes to an application.
    """
    app = await application_repo.get_by_id(application_id)
    if not app or (app.get("user_id") != current_user["_id"] and app.get("user_email") != current_user.get("email")):
        raise NotFoundError("Application not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    update_data = {
        "updated_at": now_iso
    }
    if "form_fields" in payload:
        update_data["form_fields"] = payload["form_fields"]
    if "submission_notes" in payload:
        update_data["submission_notes"] = payload["submission_notes"]
    if "status" in payload:
        update_data["status"] = payload["status"]

    timeline = app.get("timeline", [])
    note = payload.get("note") or "Candidate reviewed and updated application fields / notes."
    timeline.append({
        "title": "Application Updated by Candidate",
        "description": note,
        "timestamp": now_iso,
        "status_tag": update_data.get("status", app.get("status", "SUBMITTED"))
    })
    update_data["timeline"] = timeline

    updated = await application_repo.update(application_id, update_data)
    if updated:
        updated["id"] = updated["_id"]
    return {"success": True, "application": updated, "message": "Application updated successfully"}


@router.post("/{application_id}/review")
async def review_application(
    application_id: str,
    payload: ApplicationReviewSubmit,
    current_user: dict = Depends(get_current_user)
):
    """
    Submits user review and approvals for AI-filled fields.
    """
    fields_dict = [f.model_dump() for f in payload.updated_fields]
    result = await application_service.review_and_submit(
        app_id=application_id,
        user_id=current_user["_id"],
        updated_fields=fields_dict,
        approved=payload.approved
    )
    return result


@router.post("/{application_id}/trigger-captcha")
async def trigger_captcha_challenge(application_id: str, current_user: dict = Depends(get_current_user)):
    """
    Diagnostic/demo endpoint to simulate CAPTCHA discovery during browser automation.
    """
    return await captcha_handler.handle_captcha_detected(
        app_id=application_id,
        user_id=current_user["_id"],
        captcha_type="reCAPTCHA v2 / Image Puzzle",
        screenshot_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
    )


@router.post("/{application_id}/resolve-captcha")
async def resolve_captcha_challenge(application_id: str, current_user: dict = Depends(get_current_user)):
    """
    User triggers after human solving the CAPTCHA puzzle.
    """
    return await captcha_handler.handle_captcha_resolved(
        app_id=application_id,
        user_id=current_user["_id"]
    )


@router.post("/{application_id}/simulate-email-update")
async def simulate_email_update(
    application_id: str,
    update_type: str = Body(..., embed=True),  # assessment, interview, offer, rejection
    current_user: dict = Depends(get_current_user)
):
    """
    Simulates incoming recruiter email updating lifecycle state.
    """
    return await application_service.simulate_incoming_update(
        app_id=application_id,
        user_id=current_user["_id"],
        update_type=update_type
    )
