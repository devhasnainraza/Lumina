import uvicorn

if __name__ == "__main__":
    print("Starting uvicorn programmatically inside workspace...")
    try:
        uvicorn.run("main:app", host="0.0.0.0", port=8001, log_level="info", reload=True)
    except Exception as e:
        print(f"FAILED TO RUN: {e}")
