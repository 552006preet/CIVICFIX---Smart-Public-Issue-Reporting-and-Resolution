import os
import time
import traceback
import logging
from pathlib import Path
from typing import Callable, Any
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Setup persistent file logging
LOGS_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
FILE_LOG_PATH = LOGS_DIR / "civicfix.log"

file_handler = logging.FileHandler(FILE_LOG_PATH, encoding="utf-8")
file_handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"))
logger = logging.getLogger("civicfix.system")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(file_handler)


def log_system_event(
    level: str,
    category: str,
    message: str,
    details: str = None,
    recovery_attempted: bool = False,
    recovery_successful: bool = False,
    db = None
):
    """
    Records diagnostic and error events into both the persistent log file
    and the PostgreSQL/SQLite system_logs table for the Admin Health Dashboard.
    """
    log_msg = f"[{category}] {message}"
    if recovery_attempted:
        log_msg += f" | Recovery: {'SUCCESS' if recovery_successful else 'FAILED'}"
    if details:
        log_msg += f" | Details: {details[:200]}"
    
    if level == "CRITICAL":
        logger.critical(log_msg)
    elif level == "ERROR":
        logger.error(log_msg)
    elif level == "WARNING":
        logger.warning(log_msg)
    else:
        logger.info(log_msg)

    # Save to database if session is available or create a lightweight session
    if db:
        try:
            from app.models import SystemLog
            entry = SystemLog(
                level=level,
                category=category,
                message=message,
                details=details,
                recovery_attempted=recovery_attempted,
                recovery_successful=recovery_successful
            )
            db.add(entry)
            db.commit()
        except Exception as db_err:
            logger.error(f"Failed to persist system log to database: {db_err}")
    else:
        # Create a brief session to write the log
        try:
            from app.database import SessionLocal
            from app.models import SystemLog
            if SessionLocal:
                with SessionLocal() as session:
                    entry = SystemLog(
                        level=level,
                        category=category,
                        message=message,
                        details=details,
                        recovery_attempted=recovery_attempted,
                        recovery_successful=recovery_successful
                    )
                    session.add(entry)
                    session.commit()
        except Exception:
            pass


def execute_with_retry(operation: Callable[[], Any], max_retries: int = 3, delay: float = 0.5) -> Any:
    """
    Automatic Safe Recovery Engine:
    Executes a database or external call with automatic retry on transient failures.
    Safe for read operations and idempotent state checks.
    """
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            return operation()
        except Exception as e:
            last_exception = e
            is_last = (attempt == max_retries)
            log_system_event(
                level="WARNING" if not is_last else "ERROR",
                category="RECOVERY",
                message=f"Transient failure on attempt {attempt}/{max_retries}: {str(e)}",
                details=traceback.format_exc(),
                recovery_attempted=True,
                recovery_successful=False
            )
            if not is_last:
                time.sleep(delay * attempt)
    
    # If all retries failed, raise the final exception
    raise last_exception


async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unexpected backend exceptions, logs them with full context,
    and returns a clean, user-friendly JSON message without leaking server internals.
    """
    error_msg = str(exc)
    stack_trace = traceback.format_exc()

    log_system_event(
        level="ERROR",
        category="API",
        message=f"Unhandled exception at {request.method} {request.url.path}: {error_msg}",
        details=stack_trace,
        recovery_attempted=False,
        recovery_successful=False
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "A temporary server issue occurred. Our automatic monitoring system has logged this incident.",
            "error_type": type(exc).__name__,
            "path": request.url.path
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats Pydantic validation errors into clear, actionable beginner-friendly feedback."""
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(loc) for loc in err.get("loc", [])])
        errors.append(f"{field}: {err.get('msg')}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Please correct the submitted information.",
            "details": errors
        }
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles standard HTTPExceptions cleanly."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail
        }
    )
