"""
ApplyZen AI Orchestration Worker
"""
import asyncio
from app.core.logging import logger
from app.core.constants import QUEUE_OPPORTUNITY_PROCESSING
from app.queue.rabbitmq import rabbitmq_manager


async def process_ai_job(payload: dict):
    logger.info(f"[AIWorker] Processing AI agent task: {payload.get('task')}")


async def start_worker():
    logger.info("Starting ApplyZen AI Worker...")
    await rabbitmq_manager.connect()
    rabbitmq_manager.fallback_bus.subscribe(QUEUE_OPPORTUNITY_PROCESSING, process_ai_job)
    logger.info("AI Worker is active and waiting for agent jobs.")


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start_worker())
    loop.run_forever()
