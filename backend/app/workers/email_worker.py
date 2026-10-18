"""
ApplyZen Real Email Ingestion & Processing Worker
Polls connected OAuth inboxes (Gmail) and handles asynchronous queue jobs
to extract genuine job opportunities in real-time.
"""
import asyncio
from datetime import datetime, timezone
from app.core.logging import logger
from app.core.constants import QUEUE_EMAIL_PROCESSING
from app.queue.rabbitmq import rabbitmq_manager
from app.ai.agents.orchestrator_agent import career_orchestrator
from app.database.mongodb import get_database
from app.services.gmail_service import gmail_service
from app.services.outlook_service import outlook_service


async def process_email_job(payload: dict):
    """
    Ingests single raw career email payload from queue.
    """
    logger.info(f"[EmailWorker] Ingesting message from {payload.get('source_email')}")
    await career_orchestrator.process_email_opportunity(
        user_id=payload.get("user_id"),
        email_content=payload.get("content"),
        source_email=payload.get("source_email"),
        provider_message_id=payload.get("message_id"),
        email_received_at=payload.get("email_received_at"),
        connected_account=payload.get("connected_account"),
        provider=payload.get("provider", "gmail")
    )


async def poll_connected_inboxes():
    """
    Periodic background loop: checks all active connected user inboxes
    (Gmail and Microsoft Outlook) and pulls freshly received career emails.
    """
    while True:
        try:
            db = get_database()
            active_conns = await db.oauth_connections.find({
                "provider": {"$in": ["gmail", "outlook"]},
                "is_active": True
            }).to_list(100)

            if active_conns:
                logger.info(f"[EmailWorker] Periodic scan: Checking {len(active_conns)} active connected inboxes...")
                for conn in active_conns:
                    provider = conn.get("provider", "gmail")
                    account = conn.get("account_email", "unknown")
                    try:
                        if provider == "gmail":
                            res = await gmail_service.sync_emails(user_id=conn["user_id"], max_results=10)
                        elif provider == "outlook":
                            res = await outlook_service.sync_emails(user_id=conn["user_id"], max_results=10)
                        else:
                            continue

                        if res.get("synced_count", 0) > 0:
                            logger.info(f"✅ [EmailWorker] Ingested {res['synced_count']} new opportunities from {provider} ({account})")
                    except Exception as conn_err:
                        logger.error(f"[EmailWorker] Error syncing {provider} inbox {account}: {conn_err}")
        except Exception as e:
            logger.error(f"[EmailWorker] Error during periodic inbox poll: {e}")

        # Poll every 60 seconds for near real-time email ingestion
        await asyncio.sleep(60)


async def start_worker():
    logger.info("Starting ApplyZen Email Worker...")
    await rabbitmq_manager.connect()
    # Subscribe on fallback bus if running without RabbitMQ daemon
    rabbitmq_manager.fallback_bus.subscribe(QUEUE_EMAIL_PROCESSING, process_email_job)
    logger.info("Email Worker is listening for incoming career emails.")

    # Start periodic polling task in background
    asyncio.create_task(poll_connected_inboxes())


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_worker())
    loop.run_forever()
