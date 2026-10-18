"""
ApplyZen FastAPI Main Application Entrypoint
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import ApplyZenException
from app.database.mongodb import db_manager, get_database
from app.database.indexes import setup_indexes
import asyncio
from app.cache.redis import redis_manager
from app.api.router import api_router
from app.workers.email_worker import start_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB, Redis, and set up indexes
    logger.info(f"Initializing {settings.APP_NAME} backend...")
    await redis_manager.connect()
    await db_manager.connect_to_database()
    db = get_database()
    await setup_indexes(db)
    
    # Start Real-time Email Ingestion Worker in background
    worker_task = asyncio.create_task(start_worker())
    
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")
    worker_task.cancel()
    await redis_manager.close()
    await db_manager.close_database_connection()


app = FastAPI(
    title=settings.APP_NAME,
    description="Event-driven AI Career Operating System backend powered by Python, FastAPI, and MongoDB.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standardized ApplyZen Exception Handler
@app.exception_handler(ApplyZenException)
async def applyzen_exception_handler(request: Request, exc: ApplyZenException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )


# Standardized Request Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Input validation error",
            "error_code": "VALIDATION_ERROR",
            "details": exc.errors()
        }
    )


# General Exception Handler (Never expose raw stack traces)
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected server error occurred. Please try again later.",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )


# Mount Master API Router
app.include_router(api_router)


@app.get("/health")
async def health_check():
    redis_healthy = await redis_manager.ping()
    return {
        "status": "healthy" if redis_healthy else "degraded",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "in_memory_mock" if db_manager.is_in_memory else "mongodb_connected",
        "mongodb_uri": settings.MONGODB_URI.split("@")[-1] if "@" in settings.MONGODB_URI else settings.MONGODB_URI,
        "redis": "connected" if redis_healthy else "disconnected",
        "redis_endpoint": settings.REDIS_URL.split("@")[-1] if "@" in settings.REDIS_URL else settings.REDIS_URL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
