#!/bin/bash
# Volume Backup Script for RAG Chatbot
# Creates tar.gz archives of Docker volumes

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== RAG Chatbot Volume Backup ==="
echo "Timestamp: $TIMESTAMP"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup uploads volume
echo "Backing up uploads_data volume..."
docker run --rm \
  -v rag_uploads_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar czf "/backup/uploads_${TIMESTAMP}.tar.gz" -C /data .
echo "✓ Uploads backup complete: uploads_${TIMESTAMP}.tar.gz"

# Backup postgres volume
echo "Backing up postgres_data volume..."
docker run --rm \
  -v rag_postgres_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar czf "/backup/postgres_${TIMESTAMP}.tar.gz" -C /data .
echo "✓ PostgreSQL backup complete: postgres_${TIMESTAMP}.tar.gz"

# Backup chroma volume
echo "Backing up chroma_data volume..."
docker run --rm \
  -v rag_chroma_data:/data \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine tar czf "/backup/chroma_${TIMESTAMP}.tar.gz" -C /data .
echo "✓ ChromaDB backup complete: chroma_${TIMESTAMP}.tar.gz"

echo ""
echo "=== Backup Complete ==="
echo "All volumes backed up successfully!"
echo ""
echo "Backup files:"
ls -lh "$BACKUP_DIR"/*_${TIMESTAMP}.tar.gz

echo ""
echo "To restore these backups, use: ./backups/restore-volumes.sh <timestamp>"
echo "Example: ./backups/restore-volumes.sh $TIMESTAMP"
