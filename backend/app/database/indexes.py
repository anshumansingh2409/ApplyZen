"""
ApplyZen MongoDB Index Setup
Configures indexes for fast queries and deduplication constraints.
"""
from app.core.logging import logger

async def setup_indexes(db):
    try:
        # Users
        await db.users.create_index([("email", 1)], unique=True)
        await db.users.create_index([("username", 1)], unique=True, sparse=True)

        # Career Profile
        await db.career_profiles.create_index([("user_id", 1)], unique=True)

        # Resumes
        await db.resumes.create_index([("user_id", 1), ("is_preferred", 1)])

        # Opportunities
        await db.opportunities.create_index([("user_id", 1), ("company", 1), ("role", 1)])
        await db.opportunities.create_index([("user_id", 1), ("created_at", -1)])
        await db.opportunities.create_index([("user_id", 1), ("email_received_at", -1)])
        await db.opportunities.create_index([("provider_message_id", 1)], sparse=True)
        await db.opportunities.create_index([("deadline", 1)])

        # Ingested Emails (Fast deduplication & incremental tracking)
        await db.ingested_emails.create_index([("user_id", 1), ("message_id", 1)], unique=True)
        await db.ingested_emails.create_index([("user_id", 1), ("ingested_at", -1)])

        # Applications
        await db.applications.create_index([("user_id", 1), ("opportunity_id", 1)], unique=True)
        await db.applications.create_index([("status", 1)])
        await db.applications.create_index([("deadline", 1)])

        # Application Events
        await db.application_events.create_index([("application_id", 1), ("created_at", 1)])

        # Notifications
        await db.notifications.create_index([("user_id", 1), ("is_read", 1), ("created_at", -1)])

        logger.info("MongoDB indexes verified/created successfully.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
