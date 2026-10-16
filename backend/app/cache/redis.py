"""
ApplyZen Redis Client & Distributed Cache Manager
Connects directly to the configured Redis Cloud instance.
"""
from typing import Optional, Any
import json
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger


class RedisManager:
    client: Optional[aioredis.Redis] = None
    connected: bool = False

    async def connect(self):
        """
        Establishes connection to the configured Redis instance.
        """
        try:
            logger.info(f"Connecting to Redis at {settings.REDIS_URL.split('@')[-1]}...")
            client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=5.0,
                socket_connect_timeout=5.0
            )
            await client.ping()
            self.client = client
            self.connected = True
            logger.info("Successfully connected to Redis instance.")
        except Exception as e:
            self.connected = False
            self.client = None
            logger.error(f"Failed to connect to Redis ({e}). Verify REDIS_URL and network connectivity.")

    async def close(self):
        """
        Gracefully closes the Redis connection pool.
        """
        if self.client:
            try:
                await self.client.aclose()
            except Exception as e:
                logger.warning(f"Error while closing Redis client: {e}")
            finally:
                self.client = None
                self.connected = False
                logger.info("Redis connection closed.")

    async def ping(self) -> bool:
        """
        Pings Redis and returns True if healthy.
        """
        if not self.client:
            await self.connect()
        if self.client:
            try:
                return bool(await self.client.ping())
            except Exception as e:
                logger.warning(f"Redis ping failed: {e}")
                self.connected = False
        return False

    async def get(self, key: str) -> Optional[str]:
        if not self.client:
            await self.connect()
        if self.client:
            try:
                return await self.client.get(key)
            except Exception as e:
                logger.warning(f"Redis GET failed for {key}: {e}")
        return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if not self.client:
            await self.connect()
        if self.client:
            try:
                return bool(await self.client.set(key, value, ex=ex))
            except Exception as e:
                logger.warning(f"Redis SET failed for {key}: {e}")
        return False

    async def delete(self, key: str) -> int:
        if not self.client:
            await self.connect()
        if self.client:
            try:
                return await self.client.delete(key)
            except Exception as e:
                logger.warning(f"Redis DELETE failed for {key}: {e}")
        return 0

    async def get_json(self, key: str) -> Optional[Any]:
        raw = await self.get(key)
        if raw:
            try:
                return json.loads(raw)
            except Exception:
                return None
        return None

    async def set_json(self, key: str, data: Any, ex: Optional[int] = None) -> bool:
        try:
            raw = json.dumps(data)
            return await self.set(key, raw, ex=ex)
        except Exception as e:
            logger.warning(f"Redis SET_JSON failed for {key}: {e}")
            return False

    async def rate_limit(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Fixed window rate limiter. Returns True if allowed, False if exceeded.
        """
        if not self.client:
            await self.connect()
        if not self.client:
            return True  # Fail open if redis is completely unreachable
        try:
            current = await self.client.incr(key)
            if current == 1:
                await self.client.expire(key, window_seconds)
            return current <= limit
        except Exception as e:
            logger.warning(f"Redis rate limit check failed for {key}: {e}")
            return True


redis_manager = RedisManager()


async def get_redis():
    """
    Returns the active Redis client.
    """
    if redis_manager.client is None:
        await redis_manager.connect()
    return redis_manager.client
