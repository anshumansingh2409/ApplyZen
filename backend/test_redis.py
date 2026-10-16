"""
ApplyZen Comprehensive Redis Cloud Feature Verifier
Tests all connected Redis subsystems:
1. Ping and Basic Connectivity
2. JSON Caching & Retrieval
3. Distributed Lock Acquisition (Mutual Exclusion)
4. Atomic Rate Limiter
"""
import asyncio
from app.cache.redis import redis_manager
from app.cache.locks import DistributedLock


async def run_full_suite():
    print("=" * 60)
    print("APPLYZEN REDIS CLOUD SUBSYSTEM TEST SUITE")
    print("=" * 60)

    # 1. Connectivity & Ping
    print("\n[1] Testing Redis Connection & Ping...")
    is_alive = await redis_manager.ping()
    if not is_alive:
        print("[FAIL] Redis is unreachable! Check REDIS_URL.")
        return
    print("[PASS] Redis ping successful! Endpoint reachable.")

    # 2. JSON Caching
    print("\n[2] Testing JSON Caching (Used by Auth Sessions & Opportunities)...")
    sample_data = {
        "user_id": "usr_test_123",
        "email": "test@applyzen.com",
        "roles": ["applicant"],
        "active": True
    }
    await redis_manager.set_json("test:user:cache", sample_data, ex=10)
    retrieved = await redis_manager.get_json("test:user:cache")
    assert retrieved == sample_data, "Cached JSON does not match!"
    await redis_manager.delete("test:user:cache")
    print("[PASS] JSON stored and verified successfully from Cloud Redis.")

    # 3. Distributed Lock
    print("\n[3] Testing Distributed Lock (Used by Playwright Form Submissions)...")
    lock1 = DistributedLock("app_submission_999", ttl_seconds=10)
    lock2 = DistributedLock("app_submission_999", ttl_seconds=10)

    acquired1 = await lock1.acquire()
    acquired2 = await lock2.acquire()

    assert acquired1 is True, "First lock should be acquired"
    assert acquired2 is False, "Second concurrent lock must be blocked by Redis!"
    print("[PASS] Distributed mutual exclusion verified: Concurrent lock blocked as expected.")

    await lock1.release()
    acquired2_after = await lock2.acquire()
    assert acquired2_after is True, "Lock should now be acquirable after release"
    await lock2.release()
    print("[PASS] Distributed lock released and re-acquired successfully.")

    # 4. Atomic Rate Limiting
    print("\n[4] Testing Atomic Rate Limiter (Used by AI Assistant & APIs)...")
    limit_key = "test:ratelimit:user_456"
    for i in range(1, 4):
        allowed = await redis_manager.rate_limit(limit_key, limit=3, window_seconds=10)
        assert allowed is True, f"Request {i} should be allowed"

    # 4th request must be rejected
    blocked = await redis_manager.rate_limit(limit_key, limit=3, window_seconds=10)
    assert blocked is False, "Request over limit must be blocked!"
    await redis_manager.delete(limit_key)
    print("[PASS] Rate limiter blocked requests above quota accurately.")

    # Cleanup
    await redis_manager.close()
    print("\n" + "=" * 60)
    print("ALL SUBSYSTEMS ARE 100% CONNECTED & WORKING ON REDIS CLOUD!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_full_suite())
