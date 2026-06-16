with open("import_progress.txt", "w") as f:
    f.write("Start\n")
    f.flush()
    
    try:
        f.write("1. Importing core.config...\n")
        f.flush()
        from core.config import settings
        
        f.write("2. Importing db.session...\n")
        f.flush()
        from db.session import get_db, init_db, engine
        
        f.write("3. Importing models...\n")
        f.flush()
        import models
        
        f.write("4. Importing api.routes.auth...\n")
        f.flush()
        from api.routes import auth
        
        f.write("5. Importing api.routes.documents...\n")
        f.flush()
        from api.routes import documents
        
        f.write("6. Importing api.routes.chat...\n")
        f.flush()
        from api.routes import chat
        
        f.write("7. Importing api.routes.analytics...\n")
        f.flush()
        from api.routes import analytics
        
        f.write("8. Importing main...\n")
        f.flush()
        import main
        
        f.write("Success!\n")
        f.flush()
    except Exception as e:
        f.write(f"Error: {e}\n")
        f.flush()
