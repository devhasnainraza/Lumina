from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from sqlalchemy import text

from api.routes import auth, documents, chat, analytics
from api.middleware import RateLimitMiddleware, RequestLoggingMiddleware, CorrelationIDMiddleware
from db.session import init_db
from core.logging import setup_logging, get_logger


# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    import asyncio
    # Startup — run DB init with timeout so server is never blocked by a slow connection
    logger.info("Starting RAG Ingestion API")
    try:
        await asyncio.wait_for(init_db(), timeout=30.0)
        logger.info("Database initialized successfully")
    except asyncio.TimeoutError:
        logger.warning("Database initialization timed out (>30s) — server starting anyway")
    except Exception as e:
        logger.error(f"Database initialization error: {e} — server starting anyway")

    # Warm up embeddings model to avoid first-request delay
    logger.info("Warming up embeddings model...")
    try:
        from services.embedder import generate_embedding
        await asyncio.wait_for(generate_embedding("warmup query"), timeout=60.0)
        logger.info("Embeddings model warmed up successfully")
    except asyncio.TimeoutError:
        logger.warning("Embeddings model warmup timed out (>60s) — continuing anyway")
    except Exception as e:
        logger.warning(f"Embeddings model warmup failed: {e} — continuing anyway")

    yield
    # Shutdown
    logger.info("Shutting down RAG Ingestion API")


app = FastAPI(
    title="RAG Ingestion API",
    description="Document ingestion pipeline for RAG chatbot",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware (order matters - CorrelationID first, then logging, then rate limiting)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(CorrelationIDMiddleware)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(analytics.router)



# Custom exception classes
class DocumentNotFoundError(Exception):
    """Document not found"""
    pass


class InvalidFileTypeError(Exception):
    """Invalid file type"""
    pass


class FileTooLargeError(Exception):
    """File too large"""
    pass


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "details": exc.errors()
            }
        }
    )


@app.exception_handler(DocumentNotFoundError)
async def document_not_found_handler(request: Request, exc: DocumentNotFoundError):
    """Handle document not found errors"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": {
                "code": "DOCUMENT_NOT_FOUND",
                "message": "Document not found"
            }
        }
    )


@app.exception_handler(InvalidFileTypeError)
async def invalid_file_type_handler(request: Request, exc: InvalidFileTypeError):
    """Handle invalid file type errors"""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "INVALID_FILE_TYPE",
                "message": str(exc)
            }
        }
    )


@app.exception_handler(FileTooLargeError)
async def file_too_large_handler(request: Request, exc: FileTooLargeError):
    """Handle file too large errors"""
    return JSONResponse(
        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        content={
            "error": {
                "code": "FILE_TOO_LARGE",
                "message": str(exc)
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred"
            }
        }
    )


@app.get("/")
async def root():
    return {"message": "RAG Ingestion API", "status": "running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from db.session import engine
    from datetime import datetime

    # Check database connectivity
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "disconnected"

    # Vector DB check temporarily disabled
    vector_db_status = "disabled"

    # Determine overall status
    overall_status = "healthy" if db_status == "connected" else "unhealthy"
    status_code = status.HTTP_200_OK if overall_status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE

    response_data = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": {
            "database": db_status,
            "vector_db": vector_db_status
        },
        "version": "1.0.0"
    }

    return JSONResponse(content=response_data, status_code=status_code)


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint - indicates if service is ready to accept traffic"""
    from db.session import engine
    from datetime import datetime

    # Check if database is accessible (critical for readiness)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

        return JSONResponse(
            content={
                "ready": True,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            content={
                "ready": False,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "reason": "Database not accessible"
            },
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )
