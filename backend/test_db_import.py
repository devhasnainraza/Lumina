with open("db_import_progress.txt", "w") as f:
    f.write("Start\n")
    f.flush()
    
    try:
        f.write("1. Importing sqlalchemy...\n")
        f.flush()
        import sqlalchemy
        f.write("Success sqlalchemy\n")
        f.flush()
        
        f.write("2. Importing asyncpg...\n")
        f.flush()
        import asyncpg
        f.write("Success asyncpg\n")
        f.flush()
        
        f.write("3. Importing sqlalchemy.ext.asyncio...\n")
        f.flush()
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
        f.write("Success asyncio\n")
        f.flush()
        
    except Exception as e:
        f.write(f"Error: {e}\n")
        f.flush()
