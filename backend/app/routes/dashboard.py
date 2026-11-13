from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models import Complaint, User
from app.schemas import CitizenDashboardResponse, AdminDashboardResponse
from app.routes.complaints import format_complaint_response
from app.utils.security import get_current_user, get_current_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/citizen", response_model=CitizenDashboardResponse)
def get_citizen_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns metrics and recent complaints specific to the logged-in citizen.
    """
    user_complaints = db.query(Complaint).filter(Complaint.user_id == current_user.id)

    total = user_complaints.count()
    pending = user_complaints.filter(Complaint.status == "Pending").count()
    in_progress = user_complaints.filter(Complaint.status.in_(["Under Review", "In Progress"])).count()
    resolved = user_complaints.filter(Complaint.status == "Resolved").count()
    rejected = user_complaints.filter(Complaint.status == "Rejected").count()

    recent = (
        user_complaints
        .order_by(desc(Complaint.created_at))
        .limit(10)
        .all()
    )

    return {
        "total_complaints": total,
        "pending": pending,
        "in_progress": in_progress,
        "resolved": resolved,
        "rejected": rejected,
        "recent_complaints": [format_complaint_response(c, current_user.id) for c in recent]
    }


@router.get("/admin", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns city-wide civic metrics, category distributions,
    and recent activity for municipal administrators.
    """
    total = db.query(Complaint).count()
    pending = db.query(Complaint).filter(Complaint.status == "Pending").count()
    under_review = db.query(Complaint).filter(Complaint.status == "Under Review").count()
    in_progress = db.query(Complaint).filter(Complaint.status == "In Progress").count()
    resolved = db.query(Complaint).filter(Complaint.status == "Resolved").count()
    rejected = db.query(Complaint).filter(Complaint.status == "Rejected").count()

    # Category breakdown query
    cat_counts = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    category_breakdown = [{"category": c[0], "count": c[1]} for c in cat_counts]

    recent = (
        db.query(Complaint)
        .order_by(desc(Complaint.created_at))
        .limit(15)
        .all()
    )

    return {
        "total_complaints": total,
        "pending": pending,
        "under_review": under_review,
        "in_progress": in_progress,
        "resolved": resolved,
        "rejected": rejected,
        "category_breakdown": category_breakdown,
        "recent_complaints": [format_complaint_response(c, admin_user.id) for c in recent]
    }
