"""
ApplyZen Master API Router
Aggregates all API v1 modular routes.
"""
from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.career_profile import router as profile_router
from app.api.v1.opportunities import router as opps_router
from app.api.v1.applications import router as apps_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.subscriptions import sub_router, support_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(opps_router)
api_router.include_router(apps_router)
api_router.include_router(resumes_router)
api_router.include_router(integrations_router)
api_router.include_router(notifications_router)
api_router.include_router(assistant_router)
api_router.include_router(sub_router)
api_router.include_router(support_router)
