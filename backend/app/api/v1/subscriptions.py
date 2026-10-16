"""
ApplyZen Subscriptions & Support Endpoints
"""
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, Body
from app.auth.dependencies import get_current_user
from app.database.mongodb import get_database
from app.database.repositories.user_repository import user_repo

sub_router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])
support_router = APIRouter(prefix="/support", tags=["Support"])


# --- Subscriptions ---
@sub_router.get("/plans")
async def get_plans():
    return [
        {
            "id": "free",
            "name": "Free Tier",
            "price": "$0",
            "period": "forever",
            "description": "Essential career email tracking and manual approval workflows.",
            "features": [
                "1 Connected Email Account (Gmail)",
                "Up to 20 Detected Opportunities / mo",
                "Manual Approval Mode",
                "1 Resume Version",
                "Standard AI Career Assistant"
            ],
            "popular": False
        },
        {
            "id": "pro",
            "name": "Pro Copilot",
            "price": "$19",
            "period": "month",
            "description": "Powerful automation with zero-hallucination form filling.",
            "features": [
                "Gmail & Outlook Integration",
                "Unlimited Detected Opportunities",
                "Automatic & Approval Modes",
                "Up to 5 Resume Versions & Matching",
                "Full CAPTCHA Pausing & Context Delivery",
                "Priority AI Career Assistant"
            ],
            "popular": True
        },
        {
            "id": "enterprise",
            "name": "Career OS Ultra",
            "price": "$49",
            "period": "month",
            "description": "Maximum throughput for aggressive career transitions.",
            "features": [
                "Everything in Pro",
                "Unlimited Resume Tailoring",
                "Expedited Playwright Form Automation",
                "Custom Sensitive Field Policy Rules",
                "Dedicated Human Support Ticket Channel"
            ],
            "popular": False
        }
    ]


@sub_router.post("/checkout")
async def checkout_payment(
    plan_id: str = Body(..., embed=True),
    payment_method: str = Body("card", embed=True),
    cardholder_name: Optional[str] = Body(None, embed=True),
    last4: Optional[str] = Body("4242", embed=True),
    upi_id: Optional[str] = Body(None, embed=True),
    current_user: dict = Depends(get_current_user)
):
    """
    Processes simulated secure payment checkout and upgrades subscription status.
    """
    db = get_database()
    tx_id = f"PAY-{uuid.uuid4().hex[:12].upper()}"
    plan_name = "Pro" if "pro" in plan_id.lower() else ("Enterprise" if "ent" in plan_id.lower() else plan_id.capitalize())

    payment_record = {
        "_id": str(uuid.uuid4()),
        "transaction_id": tx_id,
        "user_id": current_user["_id"],
        "plan": plan_name,
        "payment_method": payment_method,
        "cardholder_name": cardholder_name or current_user.get("full_name", "Applicant"),
        "last4": last4,
        "upi_id": upi_id,
        "status": "PAID",
        "currency": "USD",
        "amount": 19.00 if plan_name == "Pro" else 49.00,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_record)
    await user_repo.update(current_user["_id"], {"subscription_plan": plan_name})

    return {
        "success": True,
        "message": f"Payment successfully processed for {plan_name} plan!",
        "transaction_id": tx_id,
        "plan": plan_name,
        "subscription_plan": plan_name
    }


@sub_router.post("/upgrade")
async def upgrade_plan(plan_id: str = Body(..., embed=True), current_user: dict = Depends(get_current_user)):
    plan_name = "Pro" if "pro" in plan_id.lower() else ("Enterprise" if "ent" in plan_id.lower() else plan_id.capitalize())
    await user_repo.update(current_user["_id"], {"subscription_plan": plan_name})
    return {"success": True, "plan": plan_name}


# --- Support ---
@support_router.get("/tickets")
async def list_tickets(current_user: dict = Depends(get_current_user)):
    db = get_database()
    tickets = await db.support_requests.find({"user_id": current_user["_id"]}).to_list(50)
    for t in tickets:
        t["id"] = t["_id"]
    return tickets


@support_router.post("/tickets")
async def create_ticket(
    category: str = Body(..., embed=True),
    subject: str = Body(..., embed=True),
    message: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    ticket_id = str(uuid.uuid4())
    ticket_doc = {
        "_id": ticket_id,
        "user_id": current_user["_id"],
        "category": category,
        "subject": subject,
        "message": message,
        "status": "OPEN",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.support_requests.insert_one(ticket_doc)
    ticket_doc["id"] = ticket_id
    return ticket_doc
