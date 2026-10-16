"""
ApplyZen Authentication Dependencies
"""
from typing import Optional
from fastapi import Depends, Header
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError
from app.database.repositories.user_repository import user_repo
from app.cache.redis import redis_manager


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise AuthenticationError("Authorization header missing", "NO_AUTH_HEADER")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationError("Invalid Authorization header format. Expected 'Bearer <token>'", "MALFORMED_HEADER")
    
    token = parts[1]
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload", "INVALID_PAYLOAD")

    # Fast retrieval from Cloud Redis
    cache_key = f"user:session:{user_id}"
    cached_user = await redis_manager.get_json(cache_key)
    if cached_user:
        return cached_user

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise AuthenticationError("User not found or deactivated", "USER_NOT_FOUND")

    # Cache user for 5 minutes in Redis Cloud
    await redis_manager.set_json(cache_key, user, ex=300)
    return user


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        from app.core.exceptions import PermissionDeniedError
        raise PermissionDeniedError("Admin privileges required")
    return current_user
