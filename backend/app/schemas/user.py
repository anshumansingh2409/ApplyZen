"""
ApplyZen User Schemas
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    is_active: bool = True
    role: str = "user"  # "user" or "admin"


class UserResponse(UserBase):
    id: str
    created_at: datetime
    subscription_plan: str = "Free"
    two_factor_enabled: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
