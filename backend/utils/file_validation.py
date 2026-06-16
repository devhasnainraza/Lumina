import magic
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from core.config import settings


def validate_file_type(file: UploadFile) -> str:
    """
    Validate file type using MIME type detection
    Returns the detected MIME type if valid, raises HTTPException otherwise
    """
    # Read first 2048 bytes for MIME detection
    file_content = file.file.read(2048)
    file.file.seek(0)  # Reset file pointer

    # Detect MIME type
    mime = magic.Magic(mime=True)
    detected_mime = mime.from_buffer(file_content)

    if detected_mime not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: PDF, DOCX, TXT"
        )

    return detected_mime


def validate_file_size(file: UploadFile) -> int:
    """
    Validate file size is within limits
    Returns file size in bytes if valid, raises HTTPException otherwise
    """
    # Get file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    max_size = settings.MAX_FILE_SIZE_MB * 1024 * 1024  # Convert MB to bytes

    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB"
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )

    return file_size


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other security issues
    """
    # Remove path components
    filename = Path(filename).name

    # Remove or replace dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '_', filename)

    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')

    return filename
