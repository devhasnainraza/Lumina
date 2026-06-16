"""LLM service for response generation using Gemini API directly or Groq API."""

from typing import List, Dict, Any, AsyncGenerator, Optional
import asyncio
import google.generativeai as genai
from groq import AsyncGroq
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)


class LLMService:
    """Handles LLM interactions using Gemini API directly (google-generativeai) or Groq API."""

    def __init__(self, model_name: str = None, temperature: float = None, max_tokens: int = None):
        self.model_name = model_name or settings.MODEL_NAME
        self.temperature = temperature if temperature is not None else settings.TEMPERATURE
        self.max_tokens = max_tokens or settings.MAX_RESPONSE_TOKENS

        # Configure default Gemini API key
        genai.configure(api_key=settings.GEMINI_API_KEY)

        logger.info(
            f"LLM service configured: model={self.model_name}, "
            f"temperature={self.temperature}, max_tokens={self.max_tokens}"
        )

    def _get_provider_and_model(self, api_key: Optional[str] = None, override_model: Optional[str] = None) -> tuple[str, str]:
        """
        Determine the LLM provider ('groq' or 'gemini') and the specific model to use.
        """
        model_to_use = override_model or self.model_name
        
        # Determine active key
        key = api_key or settings.GROQ_API_KEY or settings.GEMINI_API_KEY
        
        # 1. Check if the active key is a Groq key
        is_groq_key = key and key.startswith("gsk_")
        
        if is_groq_key:
            # If model name is not a Groq model, fallback to a sensible Groq model
            model = model_to_use
            if not any(x in model.lower() for x in ["llama", "mixtral", "gemma", "groq"]):
                model = "llama-3.3-70b-versatile"
            return "groq", model
            
        # 2. Otherwise, check if model name indicates Groq and we have a Groq key
        model_lower = model_to_use.lower()
        if any(x in model_lower for x in ["llama", "mixtral", "gemma", "groq"]) and settings.GROQ_API_KEY:
            return "groq", model_to_use
            
        # 3. Default to Gemini
        model = model_to_use
        if any(x in model_lower for x in ["llama", "mixtral", "gemma", "groq"]):
            model = "gemini-2.5-flash-lite"
        return "gemini", model

    def _get_gemini_model(self, model_name: str, api_key: Optional[str] = None) -> genai.GenerativeModel:
        """Get a Gemini GenerativeModel instance."""
        if api_key:
            # Temporarily reconfigure with user key
            genai.configure(api_key=api_key)
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)

        return genai.GenerativeModel(
            model_name=model_name,
            generation_config=genai.types.GenerationConfig(
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
            ),
        )

    def _build_gemini_contents(self, messages: List[Dict[str, str]]) -> List[Dict]:
        """
        Convert our message format to Gemini contents format.
        Gemini uses 'user' and 'model' roles.
        System messages are prepended to the first user message.
        """
        contents = []
        system_text = ""

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                system_text += content + "\n\n"
            elif role == "user":
                # Prepend system text to first user message
                if system_text:
                    content = f"{system_text.strip()}\n\n{content}"
                    system_text = ""
                contents.append({"role": "user", "parts": [{"text": content}]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": content}]})

        # If system_text was never consumed (no user message after it), append it
        if system_text and contents:
            last_user = next((c for c in reversed(contents) if c["role"] == "user"), None)
            if last_user:
                last_user["parts"][0]["text"] = system_text.strip() + "\n\n" + last_user["parts"][0]["text"]

        return contents

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        retry_count: int = 3,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> str:
        """Generate a non-streaming response from either Groq or Gemini."""
        provider, resolved_model = self._get_provider_and_model(api_key, model_name)
        active_key = api_key or (settings.GROQ_API_KEY if provider == "groq" else settings.GEMINI_API_KEY)
        temp_val = temperature if temperature is not None else self.temperature

        for attempt in range(retry_count):
            try:
                logger.info(f"Generating response using {provider}:{resolved_model} (attempt {attempt + 1}/{retry_count})")

                if provider == "groq":
                    client = AsyncGroq(api_key=active_key)
                    response = await client.chat.completions.create(
                        model=resolved_model,
                        messages=messages,
                        temperature=temp_val,
                        max_tokens=self.max_tokens,
                    )
                    response_text = response.choices[0].message.content
                else:
                    model = self._get_gemini_model(resolved_model, active_key)
                    
                    # Update temperature dynamically if model is created
                    if temperature is not None:
                        model.generation_config.temperature = temperature

                    contents = self._build_gemini_contents(messages)
                    response = await model.generate_content_async(contents)
                    response_text = response.text

                logger.info(f"Generated response: {len(response_text)} characters")
                return response_text

            except Exception as e:
                logger.error(f"LLM generation failed (attempt {attempt + 1}) on {provider}: {e}")
                if attempt < retry_count - 1:
                    wait_time = 2 ** attempt
                    logger.info(f"Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    raise ValueError(f"LLM generation failed after {retry_count} attempts: {e}")

    async def generate_streaming_response(
        self,
        messages: List[Dict[str, str]],
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming response from either Groq or Gemini."""
        provider, resolved_model = self._get_provider_and_model(api_key, model_name)
        active_key = api_key or (settings.GROQ_API_KEY if provider == "groq" else settings.GEMINI_API_KEY)
        temp_val = temperature if temperature is not None else self.temperature

        try:
            logger.info(f"Starting streaming response generation on {provider}:{resolved_model}")

            if provider == "groq":
                client = AsyncGroq(api_key=active_key)
                response_stream = await client.chat.completions.create(
                    model=resolved_model,
                    messages=messages,
                    temperature=temp_val,
                    max_tokens=self.max_tokens,
                    stream=True
                )
                async for chunk in response_stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            else:
                model = self._get_gemini_model(resolved_model, active_key)
                if temperature is not None:
                    model.generation_config.temperature = temperature
                contents = self._build_gemini_contents(messages)

                # Use generate_content_async for fully non-blocking async streaming
                response_stream = await model.generate_content_async(contents, stream=True)

                async for chunk in response_stream:
                    try:
                        if chunk.text:
                            yield chunk.text
                    except Exception as e:
                        logger.warning(f"Error reading chunk text: {e}")

            logger.info("Streaming response completed")

        except Exception as e:
            logger.error(f"Streaming generation failed on {provider}: {e}")
            raise ValueError(f"Streaming generation failed: {e}")

    async def generate_with_fallback(
        self,
        messages: List[Dict[str, str]],
        fallback_message: str = "I'm having trouble generating a response right now. Please try again.",
    ) -> str:
        """Generate response with fallback on failure."""
        try:
            return await self.generate_response(messages)
        except Exception as e:
            logger.error(f"LLM generation failed, using fallback: {e}")
            return fallback_message


# Global LLM service instance
llm_service = LLMService()
