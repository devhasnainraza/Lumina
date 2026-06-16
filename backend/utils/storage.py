import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from core.config import settings


def get_file_path(user_id: str, filename: str) -> str:
    """
    Generate a unique file path for storing uploaded file
    """
    # Create user-specific directory
    user_dir = Path(settings.UPLOAD_DIR) / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename to avoid collisions
    file_ext = Path(filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    return str(user_dir / unique_filename)


async def save_uploaded_file(file: UploadFile, file_path: str) -> None:
    """
    Save uploaded file to disk
    """
    # Ensure directory exists
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)

    # Write file in chunks to handle large files
    with open(file_path, "wb") as f:
        while chunk := await file.read(8192):  # Read 8KB at a time
            f.write(chunk)


def delete_file(file_path: str) -> None:
    """
    Delete file from disk
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        # Log error but don't raise - file might already be deleted
        print(f"Error deleting file {file_path}: {e}")
