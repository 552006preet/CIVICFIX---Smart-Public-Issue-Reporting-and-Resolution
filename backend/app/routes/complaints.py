from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models import Complaint, ComplaintStatusHistory, Vote, User, Notification
from app.schemas import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintStatusUpdate,
    ComplaintResponse,
    ComplaintListResponse,
    StatusHistoryResponse
)
from app.utils.security import get_current_user, get_current_admin, get_optional_user
from app.utils.file_upload import save_uploaded_image
from app.utils.error_handler import log_system_event

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def format_complaint_response(complaint: Complaint, current_user_id: Optional[int] = None) -> dict:
    """Helper to convert Complaint ORM object to schema dictionary with dynamic fields."""
    has_upvoted = False
    if current_user_id and complaint.votes:
        has_upvoted = any(v.user_id == current_user_id for v in complaint.votes)
    
    # Format status history
    history_list = []
    if complaint.status_history:
        for h in complaint.status_history:
            history_list.append({
                "id": h.id,
                "complaint_id": h.complaint_id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "comment": h.comment,
                "changed_by_name": h.changed_by.full_name if h.changed_by else "Municipal Administrator",
                "created_at": h.created_at
            })

    return {
        "id": complaint.id,
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "image_url": complaint.image_url,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "address": complaint.address,
        "status": complaint.status,
        "resolution_notes": complaint.resolution_notes,
        "resolution_image_url": complaint.resolution_image_url,
        "upvotes_count": complaint.upvotes_count,
        "user_id": complaint.user_id,
        "author_name": complaint.author.full_name if complaint.author else "Citizen",
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "has_upvoted": has_upvoted,
        "status_history": history_list
    }


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Uploads a complaint photograph and returns its URL."""
    file_url = await save_uploaded_image(file)
    return {"success": True, "image_url": file_url}


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a new civic complaint.
    Stores location coordinates, description, category, and optional image.
    Initializes status as 'Pending' with an initial status history record.
    """
    new_complaint = Complaint(
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address.strip() if data.address else None,
        image_url=data.image_url,
        status="Pending",
        upvotes_count=0,
        user_id=current_user.id
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Record initial status in history
    initial_history = ComplaintStatusHistory(
        complaint_id=new_complaint.id,
        old_status="None",
        new_status="Pending",
        comment="Complaint reported by citizen and queued for municipal review.",
        changed_by_user_id=current_user.id
    )
    db.add(initial_history)
    db.commit()

    log_system_event(
        level="INFO",
        category="API",
        message=f"Complaint #{new_complaint.id} ('{new_complaint.title[:30]}...') filed by {current_user.email}",
        db=db
    )

    return format_complaint_response(new_complaint, current_user.id)


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    search: Optional[str] = Query(None, description="Search in title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: Optional[str] = Query("newest", description="'newest' or 'upvotes'"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Publicly lists all complaints with search, category filtering,
    status filtering, and sorting (by newest or most upvoted).
    """
    query = db.query(Complaint)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(search_term),
                Complaint.description.ilike(search_term),
                Complaint.address.ilike(search_term)
            )
        )

    if category and category != "All":
        query = query.filter(Complaint.category == category)

    if status and status != "All":
        query = query.filter(Complaint.status == status)

    # Sorting
    if sort_by == "upvotes":
        query = query.order_by(desc(Complaint.upvotes_count), desc(Complaint.created_at))
    else:
        query = query.order_by(desc(Complaint.created_at))

    total = query.count()
    offset = (page - 1) * limit
    complaints = query.offset(offset).limit(limit).all()

    current_user_id = current_user.id if current_user else None
    items = [format_complaint_response(c, current_user_id) for c in complaints]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Retrieves full details of a single complaint including its status history."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint #{complaint_id} was not found.",
        )
    current_user_id = current_user.id if current_user else None
    return format_complaint_response(complaint, current_user_id)


@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    data: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows the author or an admin to edit complaint details."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    
    if complaint.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to edit this complaint.")

    if data.title:
        complaint.title = data.title.strip()
    if data.description:
        complaint.description = data.description.strip()
    if data.category:
        complaint.category = data.category
    if data.address:
        complaint.address = data.address.strip()

    db.commit()
    db.refresh(complaint)
    return format_complaint_response(complaint, current_user.id)


@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows municipal administrators or the author to delete spam or inappropriate complaints."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    
    if complaint.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have permission to delete this complaint.")

    db.delete(complaint)
    db.commit()

    log_system_event(
        level="INFO",
        category="API",
        message=f"Complaint #{complaint_id} deleted by {current_user.email} (Role: {current_user.role})",
        db=db
    )

    return {"success": True, "message": f"Complaint #{complaint_id} was successfully deleted."}


@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_data: ComplaintStatusUpdate,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Municipal Administrator action:
    Updates status ('Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'),
    logs the change in ComplaintStatusHistory, and notifies the reporting citizen.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    valid_statuses = ["Pending", "Under Review", "In Progress", "Resolved", "Rejected"]
    if status_data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status_data.status}'. Allowed: {', '.join(valid_statuses)}"
        )

    old_status = complaint.status
    complaint.status = status_data.status

    if status_data.resolution_notes:
        complaint.resolution_notes = status_data.resolution_notes
    if status_data.resolution_image_url:
        complaint.resolution_image_url = status_data.resolution_image_url

    # Add to status history audit trail
    history_entry = ComplaintStatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=status_data.status,
        comment=status_data.comment or f"Status updated from {old_status} to {status_data.status} by municipal team.",
        changed_by_user_id=admin_user.id
    )
    db.add(history_entry)

    # Notify the citizen who reported the issue
    notification = Notification(
        user_id=complaint.user_id,
        title=f"Complaint #{complaint.id} Status Updated",
        message=f"Your report '{complaint.title}' has been moved to '{status_data.status}'."
    )
    db.add(notification)

    db.commit()
    db.refresh(complaint)

    log_system_event(
        level="INFO",
        category="API",
        message=f"Complaint #{complaint.id} status changed from '{old_status}' to '{complaint.status}' by admin {admin_user.email}",
        db=db
    )

    return format_complaint_response(complaint, admin_user.id)


@router.get("/{complaint_id}/history", response_model=List[StatusHistoryResponse])
def get_complaint_history(complaint_id: int, db: Session = Depends(get_db)):
    """Returns the chronological audit trail of status updates for a complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    history_records = (
        db.query(ComplaintStatusHistory)
        .filter(ComplaintStatusHistory.complaint_id == complaint_id)
        .order_by(desc(ComplaintStatusHistory.created_at))
        .all()
    )

    results = []
    for h in history_records:
        results.append({
            "id": h.id,
            "complaint_id": h.complaint_id,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "comment": h.comment,
            "changed_by_name": h.changed_by.full_name if h.changed_by else "Municipal Administrator",
            "created_at": h.created_at
        })
    return results


@router.post("/{complaint_id}/vote")
def toggle_vote(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggles upvote on a complaint:
    - If user has not voted yet, adds vote and increments upvotes_count.
    - If user has already voted, removes vote and decrements upvotes_count.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    existing_vote = (
        db.query(Vote)
        .filter(Vote.complaint_id == complaint_id, Vote.user_id == current_user.id)
        .first()
    )

    if existing_vote:
        # Unvote
        db.delete(existing_vote)
        complaint.upvotes_count = max(0, complaint.upvotes_count - 1)
        db.commit()
        has_upvoted = False
    else:
        # Upvote
        new_vote = Vote(complaint_id=complaint_id, user_id=current_user.id)
        db.add(new_vote)
        complaint.upvotes_count += 1
        db.commit()
        has_upvoted = True

    return {
        "success": True,
        "complaint_id": complaint_id,
        "has_upvoted": has_upvoted,
        "upvotes_count": complaint.upvotes_count
    }
