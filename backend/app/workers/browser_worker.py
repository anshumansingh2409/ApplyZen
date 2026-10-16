"""
ApplyZen Playwright Browser Automation Worker
"""
import asyncio
from app.core.logging import logger
from app.core.constants import QUEUE_BROWSER_AUTOMATION
from app.queue.rabbitmq import rabbitmq_manager
from app.automation.browser.playwright_manager import playwright_manager
from app.services.application_service import application_service


async def process_browser_job(payload: dict):
    app_id = payload.get("application_id")
    user_id = payload.get("user_id")
    form_fields = payload.get("form_fields", [])
    logger.info(f"[BrowserWorker] Submitting application {app_id} via Playwright")
    await application_service.review_and_submit(app_id, user_id, form_fields, approved=True)


async def start_worker():
    logger.info("Starting ApplyZen Browser Worker...")
    await rabbitmq_manager.connect()
    rabbitmq_manager.fallback_bus.subscribe(QUEUE_BROWSER_AUTOMATION, process_browser_job)
    logger.info("Browser Worker is active for form submissions.")


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_worker())
    loop.run_forever()
