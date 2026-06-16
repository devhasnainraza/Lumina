import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # Step 1: Login
        print("Attempting to login...")
        login_res = await client.post(
            "http://localhost:8001/auth/login",
            json={"email": "testuser_new@example.com", "password": "Password123!"},
            timeout=60.0
        )
        print("Login status:", login_res.status_code)
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
        
        token = login_res.json()["access_token"]
        print("Login successful! Token acquired.")

        # Step 2: Send Chat Message
        print("\nSending chat query 'Hello'...")
        chat_res = await client.post(
            "http://localhost:8001/api/chat",
            headers={"Authorization": f"Bearer {token}"},
            json={"query": "Hello", "stream": False},
            timeout=60.0
        )
        print("Chat status:", chat_res.status_code)
        print("Chat response:", chat_res.text)

if __name__ == "__main__":
    asyncio.run(main())
