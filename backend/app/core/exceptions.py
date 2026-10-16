"""
ApplyZen Custom Exceptions and Structured Error Representation
"""
from typing import Optional, Any
from fastapi import HTTPException, status


class ApplyZenException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        message: str = "An error occurred",
        error_code: str = "GENERIC_ERROR",
        details: Optional[Any] = None,
    ):
        super().__init__(
            status_code=status_code,
            detail={
                "success": False,
                "message": message,
                "error_code": error_code,
                "details": details,
            },
        )
        self.message = message
        self.error_code = error_code
        self.details = details


class AuthenticationError(ApplyZenException):
    def __init__(self, message: str = "Authentication failed", error_code: str = "AUTH_FAILED"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            error_code=error_code,
        )


class PermissionDeniedError(ApplyZenException):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            error_code="PERMISSION_DENIED",
        )


class NotFoundError(ApplyZenException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            error_code="NOT_FOUND",
        )


class DuplicateError(ApplyZenException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            error_code="DUPLICATE_RESOURCE",
        )


class ActionRequiredError(ApplyZenException):
    def __init__(self, message: str = "User action is required to proceed", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error_code="ACTION_REQUIRED",
            details=details,
        )


class ZeroHallucinationGuardError(ApplyZenException):
    def __init__(self, missing_fields: list):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message="Required personal data is missing from Career Knowledge Base. User input required.",
            error_code="ZERO_HALLUCINATION_GUARD",
            details={"missing_fields": missing_fields},
        )


class RateLimitError(ApplyZenException):
    def __init__(self, message: str = "Rate limit exceeded. Please try again shortly.", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details,
        )
