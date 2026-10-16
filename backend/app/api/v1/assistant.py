"""
ApplyZen AI Career Assistant Endpoints
"""
from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.schemas.assistant import AssistantQuery, AssistantResponse
from app.ai.agents.assistant_agent import assistant_agent
from app.database.repositories.career_profile_repository import career_profile_repo
from app.database.repositories.opportunity_repository import opportunity_repo
from app.database.repositories.application_repository import application_repo
from app.database.repositories.resume_repository import resume_repo
from app.cache.redis import redis_manager
from app.core.exceptions import RateLimitError

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


@router.post("/query", response_model=AssistantResponse)
async def query_assistant(payload: AssistantQuery, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]

    # Redis Cloud Rate Limiting: max 30 queries per 60 seconds per user
    allowed = await redis_manager.rate_limit(f"rate:assistant:{user_id}", limit=30, window_seconds=60)
    if not allowed:
        raise RateLimitError("AI query rate limit exceeded. Please wait a moment before sending more queries.")

    profile = await career_profile_repo.get_by_user_id(user_id) or {}
    opps = await opportunity_repo.list_by_user(user_id)
    apps = await application_repo.list_by_user(user_id)
    resumes = await resume_repo.list_by_user(user_id)

    response = await assistant_agent.answer_query(
        question=payload.question,
        user=current_user,
        career_profile=profile,
        opportunities=opps,
        applications=apps,
        resumes=resumes
    )
    return response
