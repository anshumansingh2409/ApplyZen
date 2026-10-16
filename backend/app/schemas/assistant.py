"""
ApplyZen AI Assistant & Notification Schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AssistantMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data_references: Optional[Dict[str, Any]] = None


class AssistantQuery(BaseModel):
    question: str
    conversation_history: List[AssistantMessage] = []


class AssistantResponse(BaseModel):
    answer: str
    suggested_actions: List[str] = []
    data_references: Optional[Dict[str, Any]] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str  # "opportunity", "review_required", "captcha", "deadline", "status_change", "system"
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    is_read: bool = False
    action_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
