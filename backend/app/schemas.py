from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ==================== User Schemas ====================

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = "citizen"  # "citizen" or "admin"
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== Complaint Schemas ====================

class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    image_url: Optional[str] = None


class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None


class ComplaintStatusUpdate(BaseModel):
    status: str  # 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'
    comment: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolution_image_url: Optional[str] = None


class StatusHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    old_status: str
    new_status: str
    comment: Optional[str] = None
    changed_by_name: Optional[str] = "Municipal Administrator"
    created_at: datetime

    class Config:
        from_attributes = True


class ComplaintResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    resolution_image_url: Optional[str] = None
    upvotes_count: int
    user_id: int
    author_name: Optional[str] = "Citizen"
    created_at: datetime
    updated_at: datetime
    has_upvoted: Optional[bool] = False
    status_history: Optional[List[StatusHistoryResponse]] = []

    class Config:
        from_attributes = True


class ComplaintListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ComplaintResponse]


# ==================== Dashboard Schemas ====================

class CitizenDashboardResponse(BaseModel):
    total_complaints: int
    pending: int
    in_progress: int
    resolved: int
    rejected: int
    recent_complaints: List[ComplaintResponse]


class CategoryStat(BaseModel):
    category: str
    count: int


class AdminDashboardResponse(BaseModel):
    total_complaints: int
    pending: int
    under_review: int
    in_progress: int
    resolved: int
    rejected: int
    category_breakdown: List[CategoryStat]
    recent_complaints: List[ComplaintResponse]


# ==================== System Health & Logs ====================

class DatabaseHealth(BaseModel):
    status: str
    type: str
    latency_ms: float
    healthy: bool
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    uptime_seconds: float
    database: DatabaseHealth


class SystemLogResponse(BaseModel):
    id: int
    level: str
    category: str
    message: str
    details: Optional[str] = None
    recovery_attempted: bool
    recovery_successful: bool
    created_at: datetime

    class Config:
        from_attributes = True
