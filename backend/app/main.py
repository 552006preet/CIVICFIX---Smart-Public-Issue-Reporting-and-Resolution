import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.database import engine, Base, SessionLocal
from app.models import User, Complaint, ComplaintStatusHistory, Vote, SystemLog
from app.utils.security import hash_password
from app.utils.error_handler import (
    global_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    log_system_event
)
from app.routes import auth, complaints, dashboard, health

# Ensure upload directory exists
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def seed_initial_data():
    """
    Seeds initial demonstration accounts and realistic civic complaints
    so the platform is immediately interactive for university evaluation.
    """
    with SessionLocal() as db:
        # Check if users already exist
        admin = db.query(User).filter(User.email == "admin@civicfix.gov").first()
        if not admin:
            admin = User(
                full_name="Municipal Administrator",
                email="admin@civicfix.gov",
                hashed_password=hash_password("Preet@2006"),
                role="admin",
                phone="+91 98765 43210"
            )
            db.add(admin)
        else:
            admin.hashed_password = hash_password("Preet@2006")

        citizen = db.query(User).filter(User.email == "citizen@civicfix.org").first()
        if not citizen:
            citizen = User(
                full_name="Preet",
                email="citizen@civicfix.org",
                hashed_password=hash_password("Preet@2006"),
                role="citizen",
                phone="+91 91234 56789"
            )
            db.add(citizen)
        else:
            citizen.full_name = "Preet"
            citizen.hashed_password = hash_password("Preet@2006")

        db.commit()
        db.refresh(admin)
        db.refresh(citizen)

        # Check if complaints already exist
        if db.query(Complaint).count() == 0:
            sample_complaints = [
                {
                    "title": "Severe Pothole on Main Market Road",
                    "description": "Deep pothole causing recurring bike accidents and traffic congestion near Sector 14 market crossing.",
                    "category": "Roads & Potholes",
                    "latitude": 28.6139,
                    "longitude": 77.2090,
                    "address": "Sector 14 Main Commercial Avenue, New Delhi",
                    "status": "In Progress",
                    "upvotes_count": 18,
                    "user_id": citizen.id,
                    "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
                    "history": [
                        ("None", "Pending", "Reported by citizen."),
                        ("Pending", "Under Review", "Assigned to Public Works Department inspection team."),
                        ("Under Review", "In Progress", "Road repair crew dispatched with asphalt patcher.")
                    ]
                },
                {
                    "title": "Overflowing Garbage Dump Near Public Park",
                    "description": "Municipal waste bin has not been cleared for 4 days, causing foul smell and health hazard near the children's park.",
                    "category": "Garbage & Waste",
                    "latitude": 28.6219,
                    "longitude": 77.2144,
                    "address": "Block C Green Park, New Delhi",
                    "status": "Resolved",
                    "upvotes_count": 25,
                    "user_id": citizen.id,
                    "image_url": "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80",
                    "resolution_notes": "Garbage collected by municipal truck #DL-04-A1209. Daily collection frequency increased.",
                    "resolution_image_url": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
                    "history": [
                        ("None", "Pending", "Reported by citizen."),
                        ("Pending", "Under Review", "Sent to sanitation supervisor."),
                        ("Under Review", "In Progress", "Sanitation truck dispatched."),
                        ("In Progress", "Resolved", "Area cleared and disinfected.")
                    ]
                },
                {
                    "title": "Broken Streetlight on School Road",
                    "description": "Streetlight pole #42 is flickering and completely off after 8 PM, making the footpath unsafe for pedestrians and students.",
                    "category": "Streetlights",
                    "latitude": 28.6080,
                    "longitude": 77.2210,
                    "address": "Vidya Marg, Near Kendriya Vidyalaya, New Delhi",
                    "status": "Pending",
                    "upvotes_count": 9,
                    "user_id": citizen.id,
                    "image_url": "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80",
                    "history": [
                        ("None", "Pending", "Reported by citizen. Awaiting municipal electrical department review.")
                    ]
                },
                {
                    "title": "Major Drinking Water Pipe Leakage",
                    "description": "Clean water pipeline has ruptured underground, causing water to pool on the road and wasting hundreds of liters.",
                    "category": "Water Supply & Leakage",
                    "latitude": 28.6289,
                    "longitude": 77.2065,
                    "address": "Ring Road Junction 3, New Delhi",
                    "status": "Under Review",
                    "upvotes_count": 31,
                    "user_id": citizen.id,
                    "image_url": "https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&auto=format&fit=crop&q=80",
                    "history": [
                        ("None", "Pending", "Reported by citizen."),
                        ("Pending", "Under Review", "Water Board emergency response team reviewing pipeline pressure.")
                    ]
                },
                {
                    "title": "Open Sewage Manhole Cover Missing",
                    "description": "Manhole cover is completely missing on the pedestrian sidewalk. Serious accident risk at night.",
                    "category": "Drainage & Sewage",
                    "latitude": 28.6180,
                    "longitude": 77.2300,
                    "address": "Central Avenue Sidewalk, New Delhi",
                    "status": "In Progress",
                    "upvotes_count": 42,
                    "user_id": citizen.id,
                    "image_url": "https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&auto=format&fit=crop&q=80",
                    "history": [
                        ("None", "Pending", "Reported by citizen."),
                        ("Pending", "Under Review", "Barricaded temporarily with safety cones."),
                        ("Under Review", "In Progress", "Replacement heavy-duty cast iron cover ordered.")
                    ]
                }
            ]

            for sc in sample_complaints:
                complaint_obj = Complaint(
                    title=sc["title"],
                    description=sc["description"],
                    category=sc["category"],
                    latitude=sc["latitude"],
                    longitude=sc["longitude"],
                    address=sc["address"],
                    status=sc["status"],
                    upvotes_count=sc["upvotes_count"],
                    user_id=sc["user_id"],
                    image_url=sc.get("image_url"),
                    resolution_notes=sc.get("resolution_notes"),
                    resolution_image_url=sc.get("resolution_image_url")
                )
                db.add(complaint_obj)
                db.commit()
                db.refresh(complaint_obj)

                for old_s, new_s, comm in sc.get("history", []):
                    h_obj = ComplaintStatusHistory(
                        complaint_id=complaint_obj.id,
                        old_status=old_s,
                        new_status=new_s,
                        comment=comm,
                        changed_by_user_id=admin.id
                    )
                    db.add(h_obj)
                db.commit()

            # Record system startup log
            log_system_event(
                level="INFO",
                category="DATABASE",
                message="Initial database schema created and demo civic complaints seeded successfully.",
                db=db
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: sets up database tables and seeds demo data."""
    try:
        Base.metadata.create_all(bind=engine)
        seed_initial_data()
    except Exception as e:
        log_system_event(
            level="ERROR",
            category="DATABASE",
            message=f"Error during schema initialization: {str(e)}"
        )
    yield


app = FastAPI(
    title="CivicFix API",
    description="Smart Public Issue Reporting & Resolution Platform - REST API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory as static web path
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Register custom exception handlers for robust error handling
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

# Include API Routers
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(dashboard.router)
app.include_router(health.router)


@app.get("/")
def root():
    return {
        "platform": "CivicFix - Smart Public Issue Reporting Platform",
        "status": "Operational",
        "documentation": "/docs",
        "health_check": "/health"
    }
