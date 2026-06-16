"""Token counting utilities using tiktoken for accurate token estimation."""

import tiktoken
from typing import List, Dict, Any


class TokenCounter:
    """Utility class for counting tokens in text using tiktoken."""

    def __init__(self, model_name: str = "gpt-4"):
        """
        Initialize token counter with specified model encoding.

        Args:
            model_name: Model name for encoding (default: gpt-4)
        """
        try:
            self.encoding = tiktoken.encoding_for_model(model_name)
        except KeyError:
            # Fallback to cl100k_base encoding (used by GPT-4 and GPT-3.5-turbo)
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """
        Count tokens in a single text string.

        Args:
            text: Input text to count tokens

        Returns:
            Number of tokens in the text
        """
        if not text:
            return 0
        return len(self.encoding.encode(text))

    def count_messages_tokens(self, messages: List[Dict[str, str]]) -> int:
        """
        Count tokens in a list of chat messages.

        Args:
            messages: List of message dicts with 'role' and 'content' keys

        Returns:
            Total number of tokens including message formatting overhead
        """
        total_tokens = 0

        for message in messages:
            # Add tokens for message formatting (role, content separators)
            total_tokens += 4  # Every message has overhead

            for key, value in message.items():
                total_tokens += self.count_tokens(str(value))
                if key == "role":
                    total_tokens += 1  # Role has additional token

        total_tokens += 2  # Add tokens for priming (assistant response start)

        return total_tokens

    def truncate_to_token_limit(
        self,
        text: str,
        max_tokens: int,
        from_end: bool = False
    ) -> str:
        """
        Truncate text to fit within token limit.

        Args:
            text: Input text to truncate
            max_tokens: Maximum number of tokens allowed
            from_end: If True, keep end of text; if False, keep beginning

        Returns:
            Truncated text that fits within token limit
        """
        if not text:
            return ""

        tokens = self.encoding.encode(text)

        if len(tokens) <= max_tokens:
            return text

        if from_end:
            truncated_tokens = tokens[-max_tokens:]
        else:
            truncated_tokens = tokens[:max_tokens]

        return self.encoding.decode(truncated_tokens)

    def estimate_response_tokens(self, max_tokens: int) -> int:
        """
        Estimate tokens needed for response generation.

        Args:
            max_tokens: Maximum tokens for response

        Returns:
            Estimated token count for response
        """
        return max_tokens


# Global token counter instance
token_counter = TokenCounter()
