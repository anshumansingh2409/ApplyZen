"""
ApplyZen Distributed Lock & Deduplication Engine
"""
from typing import Optional
from app.cache.redis import get_redis


class DistributedLock:
    def __init__(self, key: str, ttl_seconds: int = 60):
        self.key = f"lock:{key}"
        self.ttl = ttl_seconds

    async def acquire(self) -> bool:
        redis_client = await get_redis()
        if not redis_client:
            return True
        res = await redis_client.set(self.key, "locked", ex=self.ttl, nx=True)
        return bool(res)

    async def release(self):
        redis_client = await get_redis()
        if redis_client:
            await redis_client.delete(self.key)
