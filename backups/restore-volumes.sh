#!/bin/bash
# Volume Restore Script for RAG Chatbot
# Restores Docker volumes from tar.gz archives

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <timestamp>"
  echo ""
  echo "Example: $0 20260512_001234"
  echo ""
  echo "Available backups:"
  ls -1 ./backups/*.tar.gz 2>/dev/null | sed 's/.*\//  /' || echo "  No backups found"
  exit 1
fi

TIMESTAMP=$1
BACKUP_DIR="./backups"

echo "=== RAG Chatbot Volume Restore ==="
echo "Timestamp: $TIMESTAMP"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Check if backup files exist
if [ ! -f "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" ]; then
  echo "Error: Backup file not found: uploads_${TIMESTAMP}.tar.gz"
  exit 1
fi

if [ ! -f "$BACKUP_DIR/postgres_${TIMESTAMP}.tar.gz" ]; then
  echo "Error: Backup file not found: postgres_${TIMESTAMP}.tar.gz"
  exit 1
fi

if [ ! -f "$BACKUP_DIR/chroma_${TIMESTAMP}.tar.gz" ]; then
  echo "Error: Backup file not found: chroma_${TIMESTAMP}.tar.gz"
  exit 1
fi

# Warning
echo "⚠️  WARNING: This will overwrite existing data in Docker volumes!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo ""
echo "Stopping containers..."
docker-compose down

# Restore uploads volume
echo "Restoring uploads_data volume..."
docker run --rm \
  -v rag_uploads_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/uploads_${TIMESTAMP}.tar.gz -C /data"
echo "✓ Uploads restore complete"

# Restore postgres volume
echo "Restoring postgres_data volume..."
docker run --rm \
  -v rag_postgres_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/postgres_${TIMESTAMP}.tar.gz -C /data"
echo "✓ PostgreSQL restore complete"

# Restore chroma volume
echo "Restoring chroma_data volume..."
docker run --rm \
  -v rag_chroma_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/chroma_${TIMESTAMP}.tar.gz -C /data"
echo "✓ ChromaDB restore complete"

echo ""
echo "=== Restore Complete ==="
echo "All volumes restored successfully!"
echo ""
echo "Starting containers..."
docker-compose up -d

echo ""
echo "Restore complete. Check container status with: docker-compose ps"
