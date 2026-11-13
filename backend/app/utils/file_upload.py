import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status

# Directory where uploaded images are saved
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def save_uploaded_image(file: UploadFile) -> str:
    """
    Validates and saves an uploaded image file securely.
    Returns the relative URL path for accessing the image via web.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided for upload.",
        )
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: JPG, PNG, WEBP.",
        )
    
    # Read file content safely
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit. Please upload a smaller image.",
        )
    
    # Generate unique filename to avoid collisions and path traversal
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    destination_path = UPLOAD_DIR / unique_filename

    with open(destination_path, "wb") as f:
        f.write(content)

    return f"/uploads/{unique_filename}"
