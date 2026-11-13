import time
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db, check_database_health, init_db_engine
from app.models import SystemLog, User
from app.schemas import HealthResponse, SystemLogResponse
from app.utils.security import get_current_admin
from app.utils.error_handler import log_system_event

router = APIRouter(tags=["System Health & Diagnostics"])

START_TIME = time.time()


@router.get("/health", response_model=HealthResponse)
def get_system_health():
    """
    Comprehensive system health check:
    Monitors FastAPI server uptime and active database connectivity.
    """
    uptime = round(time.time() - START_TIME, 2)
    db_health = check_database_health()

    status = "Online" if db_health.get("healthy") else "Degraded"

    return {
        "status": status,
        "app_name": "CivicFix Smart Public Issue Reporting Platform",
        "version": "1.0.0",
        "uptime_seconds": uptime,
        "database": db_health
    }


@router.get("/health/database")
def get_database_health():
    """Returns direct diagnostics of the active database connection."""
    return check_database_health()


@router.get("/admin/system-logs", response_model=List[SystemLogResponse])
def get_system_logs(
    level: Optional[str] = Query(None, description="Filter by INFO, WARNING, ERROR, CRITICAL"),
    limit: int = Query(50, ge=1, le=200),
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin-only endpoint:
    Returns the real-time system audit logs and automated recovery attempts.
    """
    query = db.query(SystemLog)
    if level and level != "All":
        query = query.filter(SystemLog.level == level)

    logs = query.order_by(desc(SystemLog.created_at)).limit(limit).all()
    return logs


@router.post("/admin/test-recovery")
def run_recovery_simulation(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin diagnostic tool:
    Simulates a database reconnect recovery attempt and verifies connection integrity.
    """
    try:
        init_db_engine()
        db_status = check_database_health()
        
        log_system_event(
            level="INFO",
            category="RECOVERY",
            message=f"Manual connection recovery initiated by {admin_user.email}. Database status: {db_status['status']}",
            recovery_attempted=True,
            recovery_successful=db_status.get("healthy", False),
            db=db
        )
        return {
            "success": True,
            "message": "Recovery routine completed successfully.",
            "database_status": db_status
        }
    except Exception as e:
        log_system_event(
            level="ERROR",
            category="RECOVERY",
            message=f"Manual recovery diagnostic failed: {str(e)}",
            recovery_attempted=True,
            recovery_successful=False,
            db=db
        )
        return {
            "success": False,
            "message": f"Recovery failed: {str(e)}"
        }
