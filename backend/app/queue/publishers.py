"""
ApplyZen Message Queue Publishers
"""
from typing import Dict, Any
from app.queue.rabbitmq import rabbitmq_manager
from app.core.constants import (
    QUEUE_EMAIL_PROCESSING,
    QUEUE_OPPORTUNITY_PROCESSING,
    QUEUE_APPLICATION_AUTOMATION,
    QUEUE_BROWSER_AUTOMATION,
    QUEUE_APPLICATION_TRACKING,
    QUEUE_NOTIFICATION_PROCESSING
)


class EventPublisher:
    @staticmethod
    async def publish_email_received(payload: Dict[str, Any]):
        await rabbitmq_manager.publish_message(QUEUE_EMAIL_PROCESSING, payload)

    @staticmethod
    async def publish_opportunity_detected(payload: Dict[str, Any]):
        await rabbitmq_manager.publish_message(QUEUE_OPPORTUNITY_PROCESSING, payload)

    @staticmethod
    async def publish_application_submission_ready(payload: Dict[str, Any]):
        await rabbitmq_manager.publish_message(QUEUE_BROWSER_AUTOMATION, payload)

    @staticmethod
    async def publish_lifecycle_update(payload: Dict[str, Any]):
        await rabbitmq_manager.publish_message(QUEUE_APPLICATION_TRACKING, payload)


event_publisher = EventPublisher()
