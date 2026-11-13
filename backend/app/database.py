import os
import time
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Set up standard logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicfix.database")

# Read database URL from environment or fallback
# Supports PostgreSQL out of the box, with safe SQLite fallback for seamless development
DEFAULT_PG_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/civicfix_db")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_PATH = os.path.join(BASE_DIR, "civicfix.db").replace("\\", "/")
FALLBACK_SQLITE_URL = f"sqlite:///{SQLITE_PATH}"

CURRENT_DB_TYPE = "unknown"
engine = None
SessionLocal = None
Base = declarative_base()


def init_db_engine():
    """
    Initializes the database engine with automatic error detection and recovery.
    Attempts PostgreSQL first if configured. If unavailable or authentication fails,
    safely falls back to SQLite so development and demonstration never halt.
    """
    global engine, SessionLocal, CURRENT_DB_TYPE

    target_url = os.getenv("DATABASE_URL", DEFAULT_PG_URL)
    # Ensure psycopg2 driver prefix if postgresql:// was provided
    if target_url.startswith("postgresql://"):
        target_url = target_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Check if target is postgres
    if target_url.startswith("postgres"):
        try:
            logger.info("Attempting connection to PostgreSQL database...")
            test_engine = create_engine(
                target_url,
                pool_pre_ping=True,      # Automatically verify connections before using
                pool_recycle=300,        # Recycle connections every 5 minutes
                connect_args={"connect_timeout": 3}
            )
            # Test actual connection
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            engine = test_engine
            CURRENT_DB_TYPE = "PostgreSQL"
            logger.info("Successfully connected to PostgreSQL database!")
        except Exception as e:
            logger.warning(
                f"PostgreSQL connection failed ({e}). "
                f"Activating Automatic Recovery Fallback to local SQLite database..."
            )
            engine = create_engine(
                FALLBACK_SQLITE_URL,
                connect_args={"check_same_thread": False}
            )
            CURRENT_DB_TYPE = "SQLite (Fallback Recovery Active)"
    else:
        # Default SQLite
        engine = create_engine(
            FALLBACK_SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        CURRENT_DB_TYPE = "SQLite"

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine


# Initialize engine on module import
init_db_engine()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session for each incoming request
    and safely closes it after the request completes.
    """
    if SessionLocal is None:
        init_db_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_health() -> dict:
    """
    Actively checks the database connection, measures response latency,
    and returns diagnostic status for system health monitoring.
    """
    global engine, CURRENT_DB_TYPE
    start_time = time.time()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "Connected",
            "type": CURRENT_DB_TYPE,
            "latency_ms": latency_ms,
            "healthy": True
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "Disconnected",
            "type": CURRENT_DB_TYPE,
            "latency_ms": latency_ms,
            "error": str(e),
            "healthy": False
        }
