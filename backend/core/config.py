from pydantic_settings import BaseSettings
from typing import Optional
import sys


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ragdb"

    # Gemini AI (for embeddings)
    GEMINI_API_KEY: str

    # Groq API (optional, for LLM)
    GROQ_API_KEY: Optional[str] = None

    # Resend API Key (for email delivery)
    RESEND_API_KEY: Optional[str] = None

    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # Vector Database
    VECTOR_DB_PATH: str = "./data/chromadb"

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_FILE_TYPES: list[str] = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]

    # Application
    DEBUG: bool = False

    # RAG Engine Configuration
    MODEL_NAME: str = "gemini-1.5-pro"
    TEMPERATURE: float = 0.1
    TOP_K: int = 5
    MAX_CONTEXT_TOKENS: int = 6000
    MAX_RESPONSE_TOKENS: int = 1000
    MIN_RELEVANCE_SCORE: float = 0.5  # 50% similarity threshold for document retrieval

    class Config:
        env_file = ".env"  # Look for .env in backend directory
        env_file_encoding = "utf-8"
        case_sensitive = True

    def validate_required_settings(self) -> None:
        """Validate that all required settings are properly configured"""
        errors = []

        # Validate GEMINI_API_KEY
        if not self.GEMINI_API_KEY or self.GEMINI_API_KEY == "your_gemini_api_key_here":
            errors.append("GEMINI_API_KEY is required. Get your API key from https://makersuite.google.com/app/apikey")

        # Validate JWT_SECRET
        if not self.JWT_SECRET or self.JWT_SECRET in ["your_secret_key", "change-this-secret-key", "CHANGE_THIS_TO_SECURE_RANDOM_STRING_MIN_32_CHARS"]:
            errors.append("JWT_SECRET is required and must be changed from default. Generate with: openssl rand -base64 32")

        # Validate JWT_SECRET length
        if len(self.JWT_SECRET) < 32:
            errors.append("JWT_SECRET must be at least 32 characters long for security")

        # Validate DATABASE_URL
        if not self.DATABASE_URL:
            errors.append("DATABASE_URL is required")

        # Validate numeric ranges
        if self.TEMPERATURE < 0.0 or self.TEMPERATURE > 1.0:
            errors.append("TEMPERATURE must be between 0.0 and 1.0")

        if self.TOP_K < 1:
            errors.append("TOP_K must be at least 1")

        if self.MAX_FILE_SIZE_MB < 1:
            errors.append("MAX_FILE_SIZE_MB must be at least 1")

        if self.MIN_RELEVANCE_SCORE < 0.0 or self.MIN_RELEVANCE_SCORE > 1.0:
            errors.append("MIN_RELEVANCE_SCORE must be between 0.0 and 1.0")

        # If there are validation errors, print them and exit
        if errors:
            print("\n❌ Configuration Validation Failed:\n", file=sys.stderr)
            for error in errors:
                print(f"  • {error}", file=sys.stderr)
            print("\nPlease check your .env file and ensure all required variables are set correctly.\n", file=sys.stderr)
            sys.exit(1)


settings = Settings()

# Validate settings on module load
settings.validate_required_settings()
