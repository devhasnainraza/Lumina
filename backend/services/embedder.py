from typing import List, Optional
from core.logging import get_logger
from core.config import settings

logger = get_logger(__name__)

# Lazy-loaded embeddings model (only initialized on first use)
_embeddings_model = None


def _get_embeddings_model(api_key: Optional[str] = None):
    """Get or initialize the Google Generative AI embeddings model (lazy initialization)."""
    global _embeddings_model
    
    # If a user-specific API key is provided, we construct a new model
    if api_key:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key
        )
        
    if _embeddings_model is None:
        logger.info("Loading Google Generative AI embeddings model...")
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        _embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GEMINI_API_KEY
        )
        logger.info("Google Generative AI embeddings model loaded successfully")
    return _embeddings_model


async def generate_embeddings(texts: List[str], api_key: Optional[str] = None) -> List[List[float]]:
    """
    Generate embeddings asynchronously for a list of texts using Google embeddings

    Args:
        texts: List of text strings to embed
        api_key: Optional user API key

    Returns:
        List of embedding vectors (each is a list of floats)
    """
    if not texts:
        return []

    model = _get_embeddings_model(api_key)
    try:
        # Google API handles batching and rate limiting automatically (async)
        return await model.aembed_documents(texts)
    except Exception as e:
        logger.error(f"Failed to generate embeddings: {e}")
        raise ValueError(f"Embedding generation failed: {str(e)}")


async def generate_embedding(text: str, api_key: Optional[str] = None) -> List[float]:
    """
    Generate embedding asynchronously for a single text

    Args:
        text: Text string to embed
        api_key: Optional user API key

    Returns:
        Embedding vector (list of floats)
    """
    try:
        model = _get_embeddings_model(api_key)
        return await model.aembed_query(text)
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise ValueError(f"Embedding generation failed: {str(e)}")
