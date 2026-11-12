"""
ApplyZen Opportunity Endpoints
"""
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Body
from app.auth.dependencies import get_current_user
from app.database.repositories.opportunity_repository import opportunity_repo
from app.database.mongodb import get_database
from app.ai.agents.orchestrator_agent import career_orchestrator
from app.core.exceptions import NotFoundError
from app.cache.redis import redis_manager

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])


@router.get("")
async def list_opportunities(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    cache_key = f"cache:opps:{user_id}"

    # Check Cloud Redis cache first
    cached_opps = await redis_manager.get_json(cache_key)
    if cached_opps is not None:
        return cached_opps

    opps = await opportunity_repo.list_by_user(user_id)
    # Format _id to id
    for opp in opps:
        opp["id"] = opp["_id"]

    # Store in Redis Cloud for 30 seconds
    await redis_manager.set_json(cache_key, opps, ex=30)
    return opps


@router.delete("/cleanup-mock")
async def cleanup_mock_opportunities(current_user: dict = Depends(get_current_user)):
    """
    Removes demo/mock seeded opportunities (Stripe, Razorpay, Google mock) and related notifications for the current user.
    """
    user_id = current_user["_id"]
    db = get_database()
    mock_names = ["Stripe", "Razorpay", "Google", "Leading Tech Enterprise"]
    res = await db.opportunities.delete_many({
        "user_id": user_id,
        "company": {"$in": mock_names}
    })
    # Also cleanup any mock seeded notifications
    await db.notifications.delete_many({
        "user_id": user_id,
        "$or": [
            {"title": {"$regex": "Stripe|Razorpay|Google|Ground Truth", "$options": "i"}},
            {"message": {"$regex": "Stripe|Razorpay|Google|Ground Truth", "$options": "i"}},
            {"type": {"$in": ["OPPORTUNITY_DETECTED", "ACTION_REQUIRED", "VERIFICATION_SUCCESS"]}}
        ]
    })
    # Invalidate cache
    await redis_manager.delete(f"cache:opps:{user_id}")
    return {
        "success": True,
        "deleted_count": res.deleted_count,
        "message": f"Purged {res.deleted_count} mock/sample opportunities and alerts."
    }


@router.delete("/clear-all")
async def clear_all_opportunities(current_user: dict = Depends(get_current_user)):
    """
    Clears all opportunities, related applications, notifications, and ingested email cache for the current user.
    Allows a complete fresh start with their connected mailbox.
    """
    user_id = current_user["_id"]
    db = get_database()
    res = await db.opportunities.delete_many({"user_id": user_id})
    await db.applications.delete_many({"user_id": user_id})
    await db.ingested_emails.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id})
    await redis_manager.delete(f"cache:opps:{user_id}")
    return {
        "success": True,
        "deleted_count": res.deleted_count,
        "message": f"Cleared {res.deleted_count} opportunities, alerts, and reset email sync history."
    }


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    cache_key = f"cache:opp:{opportunity_id}"
    cached = await redis_manager.get_json(cache_key)
    if cached:
        return cached

    opp = await opportunity_repo.get_by_id(opportunity_id)
    if not opp or opp.get("user_id") != current_user["_id"]:
        raise NotFoundError("Opportunity not found")
    opp["id"] = opp["_id"]
    await redis_manager.set_json(cache_key, opp, ex=120)
    return opp


@router.delete("/{opportunity_id}")
async def delete_opportunity(opportunity_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    opp = await opportunity_repo.get_by_id(opportunity_id)
    if not opp or opp.get("user_id") != user_id:
        raise NotFoundError("Opportunity not found")

    await opportunity_repo.delete(opportunity_id)
    await redis_manager.delete(f"cache:opps:{user_id}")
    await redis_manager.delete(f"cache:opp:{opportunity_id}")
    return {"success": True, "message": "Opportunity deleted successfully."}


@router.post("/process-email")
async def process_email(
    email_text: str = Body(..., embed=True),
    source_email: str = Body("recruiter@company.com", embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Simulates or handles incoming email text for opportunity extraction and pipeline initialization.
    """
    user_id = current_user["_id"]
    result = await career_orchestrator.process_email_opportunity(
        user_id=user_id,
        email_content=email_text,
        source_email=source_email
    )
    # Invalidate cache so latest extracted opps show up immediately
    await redis_manager.delete(f"cache:opps:{user_id}")
    return result


@router.post("/{opportunity_id}/accept")
async def accept_and_submit_opportunity(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    User manually accepts and submits the prefilled application for this opportunity.
    Transitions status to SUBMITTED / APPLIED immediately.
    """
    user_id = current_user["_id"]
    opp = await opportunity_repo.get_by_id(opportunity_id)
    if not opp or opp.get("user_id") != user_id:
        raise NotFoundError("Opportunity not found")

    app_id = opp.get("application_id")
    from app.database.repositories.application_repository import application_repo
    from app.services.application_service import application_service

    app_doc = await application_repo.get_by_id(app_id) if app_id else None
    if not app_doc:
        # If no application record exists yet, create one
        fields = opp.get("form_fields", [])
        result = await application_service.review_and_submit(
            app_id=opp_id,
            user_id=user_id,
            updated_fields=fields,
            approved=True
        )
    else:
        fields = app_doc.get("form_fields", opp.get("form_fields", []))
        result = await application_service.review_and_submit(
            app_id=app_id,
            user_id=user_id,
            updated_fields=fields,
            approved=True
        )

    await opportunity_repo.update(opportunity_id, {
        "status": "APPLIED",
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    await redis_manager.delete(f"cache:opps:{user_id}")
    await redis_manager.delete(f"cache:opp:{opportunity_id}")
    return {"success": True, "status": "SUBMITTED", "message": f"Application for {opp.get('company')} accepted and submitted!"}


@router.post("/{opportunity_id}/inspect-form")
async def inspect_and_prefill_opportunity_form(
    opportunity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Triggers the AI agent to re-open the Google Form URL, extract fields,
    ground them with Career Ground Truth, and generate the pre-filled URL.
    """
    user_id = current_user["_id"]
    opp = await opportunity_repo.get_by_id(opportunity_id)
    if not opp or opp.get("user_id") != user_id:
        raise NotFoundError("Opportunity not found")

    target_url = opp.get("google_form_url") or opp.get("application_url")
    if not target_url:
        return {"success": False, "message": "No application or Google Form URL found for this opportunity."}

    from app.database.repositories.career_profile_repository import career_profile_repo
    from app.database.repositories.user_repository import user_repo
    from app.database.repositories.resume_repository import resume_repo
    from app.database.repositories.application_repository import application_repo
    from app.ai.agents.form_agent import form_agent

    career_profile = await career_profile_repo.get_by_user_id(user_id) or {}
    real_user = await user_repo.get_by_id(user_id) or {}
    user_doc = {
        "full_name": real_user.get("full_name") or career_profile.get("full_name") or "Anshuman Singh",
        "email": real_user.get("email") or "anshumansingh2409@gmail.com"
    }
    user_resumes = await resume_repo.list_by_user(user_id)
    best_resume = user_resumes[0] if user_resumes else {}

    inspect_res = await form_agent.inspect_and_auto_fill(
        form_url=target_url,
        company=opp["company"],
        role=opp["role"],
        career_profile=career_profile,
        user=user_doc,
        selected_resume=best_resume,
        opp_context=opp
    )

    mapped_fields = inspect_res.get("form_fields", [])
    prefilled_url = inspect_res.get("prefilled_url") or target_url
    form_title = inspect_res.get("form_title") or opp.get("form_title")

    update_payload = {
        "google_form_url": prefilled_url,
        "prefilled_url": prefilled_url,
        "form_fields": mapped_fields,
        "form_title": form_title,
        "form_status": "FORM_FILLED",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await opportunity_repo.update(opportunity_id, update_payload)

    app_id = opp.get("application_id")
    if app_id:
        await application_repo.update(app_id, {
            "google_form_url": prefilled_url,
            "prefilled_url": prefilled_url,
            "form_fields": mapped_fields,
            "form_title": form_title,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

    await redis_manager.delete(f"cache:opps:{user_id}")
    await redis_manager.delete(f"cache:opp:{opportunity_id}")

    return {
        "success": True,
        "form_title": form_title,
        "prefilled_url": prefilled_url,
        "questions_count": len(mapped_fields),
        "form_fields": mapped_fields
    }
