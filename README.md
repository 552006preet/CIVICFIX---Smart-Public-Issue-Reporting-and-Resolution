<<<<<<< HEAD
# CivicFix – Smart Public Issue Reporting & Resolution Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.14-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLAlchemy-336791?logo=postgresql)](https://www.postgresql.org)
[![CSS](https://img.shields.io/badge/Styling-Pure%20Vanilla%20CSS3-1572B6?logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Maps](https://img.shields.io/badge/Maps-Leaflet%20%7C%20OpenStreetMap-199900?logo=leaflet)](https://leafletjs.com)

**CivicFix** is a modern, transparent civic-tech full stack web application designed for smart cities. It empowers citizens to report everyday infrastructure problems—such as road potholes, overflowing garbage dumps, broken streetlights, sewage overflow, and water pipeline leaks—with photographs and GPS map coordinates. Municipal administrators can track reports through an executive command center, update progress milestones (Pending &rarr; Under Review &rarr; In Progress &rarr; Resolved), publish resolution proof photos, and monitor system health.

Built with an **Automatic Error Detection & Recovery Engine**, CivicFix ensures 24/7 reliability, connection resilience, and graceful failover for production stability.

---

## 🏛️ System Architecture

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                 Frontend Client (Browser)                   │
       │     React 18  •  Pure CSS3  •  Leaflet OpenStreetMap       │
       └──────────────────────────────┬──────────────────────────────┘
                                      │  HTTP / REST (Axios + JWT)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                Backend Server (Python FastAPI)              │
       │   Pydantic Validation  •  JWT Auth  •  Multi-part Uploads   │
       │   Automatic Error Detection & Safe Recovery Middleware       │
       └──────────────────────┬──────────────────────┬───────────────┘
                              │                      │
                   SQLAlchemy │                      │ Local Disk
                              ▼                      ▼
       ┌──────────────────────────────┐    ┌─────────────────────────┐
       │     Relational Database      │    │     Static Uploads      │
       │ PostgreSQL (Primary) /       │    │  /uploads/photo.jpg     │
       │ SQLite (Automated Failover)  │    └─────────────────────────┘
       └──────────────────────────────┘
```

---

## 🌟 Key Features

### A. For Citizens
- **Public Issue Feed**: Explore all reported city complaints in attractive cards with category tags, status badges, and vote counters.
- **Search & Multi-Filter**: Real-time search by keywords, category dropdown, status filtering, and sorting (Newest vs. Most Upvoted).
- **Interactive Geo-Tagging**: Point-and-click Leaflet map pin dropper with automatic coordinate extraction.
- **Photo Uploads**: Upload problem photographs with automatic validation (PNG, JPG, WEBP).
- **Community Upvotes**: Upvote urgent issues to boost visibility for municipal prioritization.
- **Live Status Audit Trail**: Chronological milestone tracking showing official department notes and timestamps.
- **Citizen Dashboard**: Personal metrics tracking my submitted reports, pending items, and resolved issues.

### B. For Municipal Administrators
- **Executive Command Center**: City-wide statistics (Total, Pending, Under Review, In Progress, Resolved, Rejected).
- **Category Analytics**: Instant distribution breakdown across road, sanitation, electrical, and drainage sectors.
- **Complaints Management**: Quick status switcher, administrative resolution notes, and resolution photo attachment.
- **Spam Moderation**: Delete inappropriate or fraudulent reports with automatic audit logging.

### C. Self-Healing & Automated Reliability System
- **Active Connection Probing**: `/health` and `/health/database` measure database latency and connection integrity.
- **Graceful Failover**: If PostgreSQL credentials are unconfigured or the service restarts, the backend automatically logs the incident and safely activates local SQLite storage so the platform never crashes.
- **Safe Retries**: Automatic exponential backoff retries for transient read operations.
- **Administrator Health Console**: Real-time audit trail of internal logs, severity tags (`INFO`, `WARNING`, `ERROR`, `CRITICAL`), and recovery execution results.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Axios, Lucide React, Leaflet & React-Leaflet |
| **Styling** | Pure, hand-crafted Vanilla CSS3 (No Tailwind, No Bootstrap, strict component separation) |
| **Backend** | Python 3.14 / 3.12+, FastAPI, Uvicorn (ASGI) |
| **ORM & Database** | SQLAlchemy 2.0, PostgreSQL (psycopg2-binary) with automatic SQLite development failover |
| **Validation** | Pydantic v2 & Pydantic-Settings |
| **Security** | JWT (JSON Web Tokens via PyJWT), Bcrypt password hashing (Passlib) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.12+** or **Python 3.14**
- **Node.js 18+** or **Node.js 24+** (with npm)
- **PostgreSQL** (optional; SQLite fallback runs automatically if PostgreSQL is offline)

---

### 2. Backend Setup

1. Open your terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Activate the existing virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. Install required packages (if setting up fresh):
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env` (already created for you):
   ```bash
   # In backend/.env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/civicfix_db
   SECRET_KEY=civicfix_secret_jwt_key_2026_super_secure_university_evaluation
   ```

5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *The server will start at `http://localhost:8000`. Database tables and initial demonstration data will be seeded automatically on startup!*

---

### 3. Frontend Setup

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend will open at `http://localhost:5173`.*

---

## 👥 Pre-Seeded Demonstration Accounts

For quick university evaluations and viva demonstrations, the database includes pre-configured accounts:

| Role | Email Address | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicfix.org` | `Citizen@123` | Report issues, upload photos, upvote, view personal dashboard |
| **Administrator** | `admin@civicfix.gov` | `Admin@123` | Update complaint status, add resolution notes, delete spam, inspect health logs |

*Tip: The Login page includes convenient 1-click quick fill buttons for both accounts.*

---

## 📡 REST API Documentation

FastAPI provides an interactive OpenAPI / Swagger UI at:
**`http://localhost:8000/docs`**

### Core Endpoints

#### Authentication
- `POST /auth/register` – Register a new citizen or administrator
- `POST /auth/login` – Authenticate credentials and receive Bearer JWT
- `GET /auth/me` – Get current authenticated user profile

#### Complaints
- `POST /complaints` – Submit new complaint with coordinates & description
- `POST /complaints/upload-image` – Upload a complaint photograph (multipart)
- `GET /complaints` – Public search, filter by category/status, sort by newest/upvotes
- `GET /complaints/{id}` – Full complaint details with status history
- `PUT /complaints/{id}` – Edit complaint details
- `DELETE /complaints/{id}` – Delete complaint (admin / author)
- `PUT /complaints/{id}/status` – Update progress milestone (Admin only)
- `GET /complaints/{id}/history` – Chronological status audit trail
- `POST /complaints/{id}/vote` – Upvote / toggle vote

#### Dashboards & Health
- `GET /dashboard/citizen` – Personal statistics & complaint history
- `GET /dashboard/admin` – City-wide metrics & category distribution
- `GET /health` – Server uptime & database ping diagnostic
- `GET /health/database` – Active database latency in ms
- `GET /admin/system-logs` – Automated recovery logs & error inspection
- `POST /admin/test-recovery` – Execute manual recovery diagnostic test

---

## 🧪 Postman Testing Instructions

1. **Register User**:
   - `POST http://localhost:8000/auth/register`
   - Body (JSON):
     ```json
     {
       "full_name": "Test Citizen",
       "email": "test@example.com",
       "password": "Password123",
       "role": "citizen"
     }
     ```
2. **Login & Copy Token**:
   - `POST http://localhost:8000/auth/login`
   - Body (JSON): `{"email": "citizen@civicfix.org", "password": "Citizen@123"}`
   - Copy `access_token` from JSON response.
3. **Submit Complaint with Auth**:
   - `POST http://localhost:8000/complaints`
   - Header: `Authorization: Bearer <your_copied_token>`
   - Body (JSON):
     ```json
     {
       "title": "Broken Water Pipe near Library",
       "description": "Continuous water leakage flooding the library entrance path.",
       "category": "Water Supply & Leakage",
       "latitude": 28.6139,
       "longitude": 77.2090,
       "address": "Central University Library Gate 2"
     }
     ```
4. **Test Status Update as Admin**:
   - Login with `admin@civicfix.gov` / `Admin@123`
   - `PUT http://localhost:8000/complaints/1/status`
   - Header: `Authorization: Bearer <admin_token>`
   - Body (JSON):
     ```json
     {
       "status": "Resolved",
       "comment": "Maintenance team welded the pipeline joint and restored normal water pressure.",
       "resolution_notes": "Pipeline replaced with high-density poly piping."
     }
     ```

---

## 🎓 University Evaluation & Interview Guide

### 1. Why FastAPI instead of Flask or Django?
- **Asynchronous Performance**: FastAPI is built on Starlette and Pydantic, providing native `async/await` high-throughput execution.
- **Strict Data Validation**: Pydantic validates request payloads automatically before database execution, preventing runtime TypeErrors.
- **Automatic Swagger/OpenAPI**: FastAPI auto-documents every endpoint at `/docs`, simplifying team collaboration and viva demonstrations.

### 2. How does the Automatic Error Detection & Recovery System work?
- **Health Probing**: FastAPI actively connects to PostgreSQL during startup and health requests.
- **Graceful Failover**: If PostgreSQL is temporarily down, the database manager automatically logs the event to `SystemLog` and shifts connection to local SQLite without halting user operations.
- **Retry Mechanism**: The `execute_with_retry()` wrapper retries idempotent read operations 3 times with exponential backoff on transient drops.

### 3. How does Authentication work?
- Password hashing is enforced using salted `bcrypt` algorithms.
- On login, a signed `HS256` JSON Web Token (JWT) is issued with a 24-hour expiration (`exp`), containing the user ID and role claims.
- The React frontend stores the JWT in `localStorage` and includes it in Axios headers (`Authorization: Bearer <token>`).

---

## 📄 License
This project was developed for educational and academic demonstration purposes as a Full Stack Development capstone project.
=======
# CIVICFIX---Smart-Public-Issue-Reporting-Resolution
>>>>>>> 694fd158a7af135273df31e38d3fdb5bc2d81305
