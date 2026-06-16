"""Test script to verify LLM service is working"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.llm import llm_service
from core.logging import get_logger

logger = get_logger(__name__)

async def test_llm():
    """Test if LLM generation works"""

    print("=" * 70)
    print("Testing LLM Service")
    print("=" * 70)

    test_messages = [
        {"role": "user", "content": "Say 'hello world' and nothing else"}
    ]

    try:
        print("\n[*] Testing LLM generation...")
        print(f"    Messages: {test_messages}")

        response = await llm_service.generate_response(
            messages=test_messages,
            retry_count=1
        )

        print(f"\n[OK] Response received: {response}")
        print(f"[OK] Response length: {len(response)} characters")
        return True

    except Exception as e:
        print(f"\n[ERROR] LLM test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_llm())

    if success:
        print("\n[OK] LLM service is working correctly")
    else:
        print("\n[ERROR] LLM service is NOT working")

    print("=" * 70)
