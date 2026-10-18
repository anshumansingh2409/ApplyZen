"""
ApplyZen Redis Client & Distributed Cache Manager
Connects directly to the configured Redis Cloud instance with high-speed in-memory fallback.
"""
from typing import Optional, Any, Dict, Tuple
import json
import time
import asyncio
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger


class RedisManager:
    client: Optional[aioredis.Redis] = None
    connected: bool = False
    _last_failed_time: float = 0.0
    _cooldown_seconds: float = 30.0
    _memory_cache: Dict[str, Tuple[str, Optional[float]]] = {}
    _rate_limit_cache: Dict[str, Tuple[int, float]] = {}

    async def connect(self):
        """
        Establishes connection to the configured Redis instance with fast timeout.
        """
        now = time.time()
        if now - self._last_failed_time < self._cooldown_seconds:
            # Within failure cooldown, skip attempting connection to prevent latency
            return

        try:
            logger.info(f"Connecting to Redis at {settings.REDIS_URL.split('@')[-1]}...")
            client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=1.0,
                socket_connect_timeout=1.0
            )
            await client.ping()
            self.client = client
            self.connected = True
            logger.info("Successfully connected to Redis instance.")
        except Exception as e:
            self.connected = False
            self.client = None
            self._last_failed_time = time.time()
            logger.warning(f"Redis unavailable ({e}). Using fast in-memory cache fallback.")

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
        if not self.client and (time.time() - self._last_failed_time >= self._cooldown_seconds):
            await self.connect()
        if self.client:
            try:
                return bool(await self.client.ping())
            except Exception as e:
                logger.warning(f"Redis ping failed: {e}")
                self.connected = False
                self.client = None
                self._last_failed_time = time.time()
        return False

    async def get(self, key: str) -> Optional[str]:
        if not self.client and (time.time() - self._last_failed_time >= self._cooldown_seconds):
            await self.connect()
        if self.client:
            try:
                return await self.client.get(key)
            except Exception as e:
                logger.warning(f"Redis GET failed for {key}: {e}")
                self.connected = False
                self.client = None
                self._last_failed_time = time.time()

        # In-memory fallback check
        item = self._memory_cache.get(key)
        if item:
            val, exp = item
            if exp is None or time.time() < exp:
                return val
            else:
                self._memory_cache.pop(key, None)
        return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if not self.client and (time.time() - self._last_failed_time >= self._cooldown_seconds):
            await self.connect()
        if self.client:
            try:
                return bool(await self.client.set(key, value, ex=ex))
            except Exception as e:
                logger.warning(f"Redis SET failed for {key}: {e}")
                self.connected = False
                self.client = None
                self._last_failed_time = time.time()

        # In-memory fallback store
        exp_time = (time.time() + ex) if ex else None
        self._memory_cache[key] = (value, exp_time)
        return True

    async def delete(self, key: str) -> int:
        self._memory_cache.pop(key, None)
        if not self.client and (time.time() - self._last_failed_time >= self._cooldown_seconds):
            await self.connect()
        if self.client:
            try:
                return await self.client.delete(key)
            except Exception as e:
                logger.warning(f"Redis DELETE failed for {key}: {e}")
                self.connected = False
                self.client = None
                self._last_failed_time = time.time()
        return 1

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
        if not self.client and (time.time() - self._last_failed_time >= self._cooldown_seconds):
            await self.connect()
        if self.client:
            try:
                current = await self.client.incr(key)
                if current == 1:
                    await self.client.expire(key, window_seconds)
                return current <= limit
            except Exception as e:
                logger.warning(f"Redis rate limit check failed for {key}: {e}")
                self.connected = False
                self.client = None
                self._last_failed_time = time.time()

        # In-memory rate limiting fallback
        now = time.time()
        record = self._rate_limit_cache.get(key)
        if not record or now >= record[1]:
            self._rate_limit_cache[key] = (1, now + window_seconds)
            return True
        count, reset_at = record
        if count < limit:
            self._rate_limit_cache[key] = (count + 1, reset_at)
            return True
        return False


redis_manager = RedisManager()


async def get_redis():
    """
    Returns the active Redis client.
    """
    if redis_manager.client is None:
        await redis_manager.connect()
    return redis_manager.client

