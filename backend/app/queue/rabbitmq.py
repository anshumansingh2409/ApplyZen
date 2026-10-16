"""
ApplyZen RabbitMQ Connection Manager
Handles asynchronous connection to RabbitMQ with fallback async event bus when running in local dev.
"""
from typing import Optional, Any, Callable, Dict, List
import json
import aio_pika
from app.core.config import settings
from app.core.logging import logger


class FallbackEventBus:
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}

    async def publish(self, queue_name: str, message: Dict[str, Any]):
        logger.info(f"[FallbackEventBus] Emitting event to '{queue_name}': {list(message.keys())}")
        if queue_name in self.subscribers:
            for cb in self.subscribers[queue_name]:
                try:
                    await cb(message)
                except Exception as e:
                    logger.error(f"Error handling event on {queue_name}: {e}")

    def subscribe(self, queue_name: str, handler: Callable):
        if queue_name not in self.subscribers:
            self.subscribers[queue_name] = []
        self.subscribers[queue_name].append(handler)


class RabbitMQManager:
    connection: Optional[aio_pika.abc.AbstractRobustConnection] = None
    channel: Optional[aio_pika.abc.AbstractRobustChannel] = None
    is_fallback: bool = False
    fallback_bus: FallbackEventBus = FallbackEventBus()

    async def connect(self):
        try:
            self.connection = await aio_pika.connect_robust(
                settings.RABBITMQ_URL,
                timeout=2.0
            )
            self.channel = await self.connection.channel()
            self.is_fallback = False
            logger.info("Successfully connected to RabbitMQ message broker.")
        except Exception as e:
            logger.warning(f"Could not connect to RabbitMQ ({e}). Using in-process async event bus fallback.")
            self.is_fallback = True

    async def publish_message(self, queue_name: str, payload: Dict[str, Any]):
        if self.is_fallback or not self.channel:
            await self.fallback_bus.publish(queue_name, payload)
        else:
            queue = await self.channel.declare_queue(queue_name, durable=True)
            message_body = json.dumps(payload).encode()
            await self.channel.default_exchange.publish(
                aio_pika.Message(
                    body=message_body,
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT
                ),
                routing_key=queue_name
            )

    async def close(self):
        if self.connection and not self.connection.is_closed:
            await self.connection.close()


rabbitmq_manager = RabbitMQManager()
