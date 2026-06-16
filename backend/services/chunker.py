import tiktoken
import re
from typing import List, Tuple
from core.logging import get_logger

logger = get_logger(__name__)

# Default encoding for OpenAI models
ENCODING_NAME = "cl100k_base"


def chunk_text(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 100,
    encoding_name: str = ENCODING_NAME
) -> List[Tuple[str, int]]:
    """
    Chunk text into segments using tiktoken for token counting

    Args:
        text: Text to chunk
        chunk_size: Target size in tokens (500-1000 recommended)
        chunk_overlap: Overlap between chunks in tokens (50-100 recommended)
        encoding_name: Tiktoken encoding name

    Returns:
        List of tuples (chunk_text, token_count)
    """
    # Get tokenizer
    encoding = tiktoken.get_encoding(encoding_name)

    # Normalize text
    text = _normalize_text(text)

    # Split into sentences for better chunk boundaries
    sentences = _split_into_sentences(text)

    chunks = []
    current_chunk = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = len(encoding.encode(sentence))

        # If single sentence exceeds chunk size, split it
        if sentence_tokens > chunk_size:
            # Save current chunk if it has content
            if current_chunk:
                txt_chunk = " ".join(current_chunk)
                chunks.append((txt_chunk, current_tokens))
                current_chunk = []
                current_tokens = 0

            # Split long sentence into smaller parts
            words = sentence.split()
            temp_chunk = []
            temp_tokens = 0

            for word in words:
                word_tokens = len(encoding.encode(word))
                if temp_tokens + word_tokens > chunk_size:
                    if temp_chunk:
                        txt_chunk = " ".join(temp_chunk)
                        chunks.append((txt_chunk, temp_tokens))
                    temp_chunk = [word]
                    temp_tokens = word_tokens
                else:
                    temp_chunk.append(word)
                    temp_tokens += word_tokens

            if temp_chunk:
                txt_chunk = " ".join(temp_chunk)
                chunks.append((txt_chunk, temp_tokens))

            continue

        # Check if adding sentence would exceed chunk size
        if current_tokens + sentence_tokens > chunk_size and current_chunk:
            # Save current chunk
            txt_chunk = " ".join(current_chunk)
            chunks.append((txt_chunk, current_tokens))

            # Start new chunk with overlap
            overlap_text = _get_overlap_text(current_chunk, chunk_overlap, encoding)
            current_chunk = [overlap_text, sentence] if overlap_text else [sentence]
            current_tokens = len(encoding.encode(" ".join(current_chunk)))
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

    # Add final chunk
    if current_chunk:
        txt_chunk = " ".join(current_chunk)
        chunks.append((txt_chunk, current_tokens))

    logger.info(f"Created {len(chunks)} chunks from text")
    return chunks


def _normalize_text(text: str) -> str:
    """Normalize text by removing extra whitespace"""
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


def _split_into_sentences(text: str) -> List[str]:
    """Split text into sentences using simple heuristics"""
    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]


def _get_overlap_text(chunk: List[str], overlap_tokens: int, encoding) -> str:
    """Get overlap text from end of previous chunk"""
    if not chunk:
        return ""

    # Start from end and work backwards
    overlap_sentences = []
    current_tokens = 0

    for sentence in reversed(chunk):
        sentence_tokens = len(encoding.encode(sentence))
        if current_tokens + sentence_tokens > overlap_tokens:
            break
        overlap_sentences.insert(0, sentence)
        current_tokens += sentence_tokens

    return " ".join(overlap_sentences)
