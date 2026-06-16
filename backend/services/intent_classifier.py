"""
Intent classification utilities for chat queries.

Determines whether a query needs document retrieval or is just general conversation.
"""

import re
from typing import Literal

QueryIntent = Literal["greeting", "chitchat", "document_query", "unclear"]

# Common greetings and casual conversation patterns
GREETING_PATTERNS = [
    r"\b(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day))\b",
    r"\b(howdy|what'?s\s+up|sup|yo)\b",
]

CHITCHAT_PATTERNS = [
    r"\bhow\s+are\s+you\b",
    r"\bhow'?s\s+it\s+going\b",
    r"\bnice\s+to\s+(meet|see)\s+you\b",
    r"\bthanks?\b|\bthank\s+you\b",
    r"\byou'?re\s+welcome\b",
    r"\bgoodbye\b|\bbye\b|\bsee\s+you\b",
    r"\bplease\s+help\s+me\b",
    r"\bwhat\s+can\s+you\s+do\b",
    r"\bwho\s+are\s+you\b",
    r"\bwhat'?s\s+your\s+name\b",
]

# Patterns that suggest document query
DOCUMENT_QUERY_PATTERNS = [
    r"\b(what|how|why|when|where|which|who)\s+.{5,}",  # Questions with substance (reduced from 10)
    r"\b(explain|describe|tell\s+me\s+about|what\s+is|define)\b",
    r"\b(show|find|search|look\s+for|get\s+me|give\s+me)\b",
    r"\b(according\s+to|in\s+the|from\s+the|based\s+on)\s+(document|file|paper|article|my\s+documents?|uploaded)\b",
    r"\b(summarize|summary|overview|analyze|analysis)\b",
    r"\b(in\s+my|from\s+my|my\s+uploaded|from\s+uploaded)\s+(document|file|paper)s?\b",
    r"\b(document|file|paper|upload)s?\b.{0,20}\b(say|mention|contain|include|about)\b",
    r"\b(check|review|read|look\s+at)\s+(the|my)?\s*(document|file|upload)s?\b",
]


def classify_query_intent(query: str) -> QueryIntent:
    """
    Classify the intent of a user query.

    Args:
        query: User's input query

    Returns:
        QueryIntent: "greeting", "chitchat", "document_query", or "unclear"
    """
    query_lower = query.lower().strip()

    # Very short queries are likely greetings or chitchat
    if len(query_lower) < 3:
        return "greeting"

    # Check for greetings
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, query_lower, re.IGNORECASE):
            # If it's ONLY a greeting (very short), classify as greeting
            if len(query_lower) < 30:
                return "greeting"

    # Check for chitchat
    for pattern in CHITCHAT_PATTERNS:
        if re.search(pattern, query_lower, re.IGNORECASE):
            return "chitchat"

    # Check for document query patterns
    has_document_pattern = False
    for pattern in DOCUMENT_QUERY_PATTERNS:
        if re.search(pattern, query_lower, re.IGNORECASE):
            has_document_pattern = True
            break

    # If query is substantial (>10 chars) and has document pattern
    if len(query_lower) > 10 and has_document_pattern:
        return "document_query"

    # If query is substantial but no clear pattern, assume document query
    # (better to search and find nothing than miss a real question)
    if len(query_lower) > 15:
        return "document_query"

    # Default to unclear for short ambiguous queries
    return "unclear"


def should_retrieve_documents(query: str) -> bool:
    """
    Determine if document retrieval should be performed for this query.

    Args:
        query: User's input query

    Returns:
        bool: True if documents should be retrieved, False otherwise
    """
    intent = classify_query_intent(query)

    # Only retrieve for document queries
    return intent == "document_query"


def get_intent_system_prompt(intent: QueryIntent) -> str:
    """
    Get appropriate system prompt based on query intent.

    Args:
        intent: The classified intent

    Returns:
        str: System prompt for the LLM
    """
    if intent == "greeting":
        return (
            "You are a friendly AI assistant. Respond warmly to the user's greeting. "
            "Keep it brief and conversational."
        )
    elif intent == "chitchat":
        return (
            "You are a helpful and friendly AI assistant. Engage in casual conversation "
            "with the user. Be personable and concise."
        )
    else:  # document_query or unclear
        return (
            "You are a helpful AI assistant with access to the user's documents. "
            "Answer questions using the provided context when relevant, or use your "
            "general knowledge when no specific context is available."
        )
