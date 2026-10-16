"""
ApplyZen Opportunity Endpoints
"""
from typing import List
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
    Removes demo/mock seeded opportunities (Stripe, Razorpay, Google mock) for the current user.
    """
    user_id = current_user["_id"]
    db = get_database()
    mock_names = ["Stripe", "Razorpay", "Google", "Leading Tech Enterprise"]
    res = await db.opportunities.delete_many({
        "user_id": user_id,
        "company": {"$in": mock_names}
    })
    # Invalidate cache
    await redis_manager.delete(f"cache:opps:{user_id}")
    return {
        "success": True,
        "deleted_count": res.deleted_count,
        "message": f"Purged {res.deleted_count} mock/sample opportunities."
    }


@router.delete("/clear-all")
async def clear_all_opportunities(current_user: dict = Depends(get_current_user)):
    """
    Clears all opportunities, related applications, and ingested email cache for the current user.
    Allows a complete fresh start with their connected mailbox.
    """
    user_id = current_user["_id"]
    db = get_database()
    res = await db.opportunities.delete_many({"user_id": user_id})
    await db.applications.delete_many({"user_id": user_id})
    await db.ingested_emails.delete_many({"user_id": user_id})
    await db.notifications.delete_many({"user_id": user_id, "type": {"$in": ["opportunity", "review_required"]}})
    await redis_manager.delete(f"cache:opps:{user_id}")
    return {
        "success": True,
        "deleted_count": res.deleted_count,
        "message": f"Cleared {res.deleted_count} opportunities and reset email sync history."
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
