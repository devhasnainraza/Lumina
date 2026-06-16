# Backup and Restore Procedures

**Feature**: Production Infrastructure - Data Persistence  
**Last Updated**: 2026-05-12

## Overview

This guide covers backup and restore procedures for Docker volumes containing critical application data.

## What Gets Backed Up

The RAG Chatbot uses three persistent Docker volumes:

| Volume | Purpose | Size Estimate | Backup Priority |
|--------|---------|---------------|-----------------|
| `rag_uploads_data` | Uploaded documents (PDF, DOCX, TXT) | 10GB initial | High |
| `rag_postgres_data` | PostgreSQL database (users, metadata, chat history) | 5GB initial | Critical |
| `rag_chroma_data` | ChromaDB vector embeddings | 20GB initial | High |

---

## Backup Procedures

### Automated Backup

Use the provided backup script to create timestamped archives of all volumes:

```bash
# Run backup script
./backups/backup-volumes.sh

# Output:
# === RAG Chatbot Volume Backup ===
# Timestamp: 20260512_143022
# Backup directory: ./backups
#
# Backing up uploads_data volume...
# ✓ Uploads backup complete: uploads_20260512_143022.tar.gz
# Backing up postgres_data volume...
# ✓ PostgreSQL backup complete: postgres_20260512_143022.tar.gz
# Backing up chroma_data volume...
# ✓ ChromaDB backup complete: chroma_20260512_143022.tar.gz
```

**Backup files created:**
- `backups/uploads_<timestamp>.tar.gz`
- `backups/postgres_<timestamp>.tar.gz`
- `backups/chroma_<timestamp>.tar.gz`

### Manual Backup

If you need to backup volumes manually:

```bash
# Backup uploads volume
docker run --rm \
  -v rag_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads_manual.tar.gz -C /data .

# Backup postgres volume
docker run --rm \
  -v rag_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_manual.tar.gz -C /data .

# Backup chroma volume
docker run --rm \
  -v rag_chroma_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/chroma_manual.tar.gz -C /data .
```

### Backup Schedule Recommendations

| Environment | Frequency | Retention |
|-------------|-----------|-----------|
| Development | Weekly | 2 weeks |
| Staging | Daily | 30 days |
| Production | Daily + hourly (last 24h) | 90 days |

---

## Restore Procedures

### Automated Restore

Use the provided restore script to restore from timestamped backups:

```bash
# List available backups
./backups/restore-volumes.sh

# Output:
# Usage: ./backups/restore-volumes.sh <timestamp>
#
# Example: ./backups/restore-volumes.sh 20260512_143022
#
# Available backups:
#   uploads_20260512_143022.tar.gz
#   postgres_20260512_143022.tar.gz
#   chroma_20260512_143022.tar.gz

# Restore from specific timestamp
./backups/restore-volumes.sh 20260512_143022

# You will be prompted to confirm:
# ⚠️  WARNING: This will overwrite existing data in Docker volumes!
# Are you sure you want to continue? (yes/no):
```

**What happens during restore:**
1. Containers are stopped (`docker-compose down`)
2. Existing volume data is cleared
3. Backup archives are extracted to volumes
4. Containers are restarted (`docker-compose up -d`)

### Manual Restore

If you need to restore volumes manually:

```bash
# Stop containers first
docker-compose down

# Restore uploads volume
docker run --rm \
  -v rag_uploads_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/uploads_20260512_143022.tar.gz -C /data"

# Restore postgres volume
docker run --rm \
  -v rag_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/postgres_20260512_143022.tar.gz -C /data"

# Restore chroma volume
docker run --rm \
  -v rag_chroma_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/chroma_20260512_143022.tar.gz -C /data"

# Restart containers
docker-compose up -d
```

---

## Disaster Recovery

### Complete System Recovery

To recover from complete data loss:

1. **Install prerequisites** (Docker, Docker Compose)
2. **Clone repository** and configure `.env`
3. **Restore volumes** from backup before first startup
4. **Start containers** and verify data integrity

```bash
# Clone and configure
git clone <repository-url>
cd rag-chatbot
cp .env.example .env
# Edit .env with your configuration

# Restore volumes (before starting containers)
./backups/restore-volumes.sh 20260512_143022

# Containers will be started automatically by restore script
# Verify restoration
docker-compose ps
curl http://localhost:8001/health
```

### Partial Recovery

To restore only specific volumes:

```bash
# Stop containers
docker-compose down

# Restore only the volume you need (example: postgres)
docker run --rm \
  -v rag_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/postgres_20260512_143022.tar.gz -C /data"

# Restart containers
docker-compose up -d
```

---

## Verification

### Verify Backup Integrity

```bash
# List backup files with sizes
ls -lh backups/*.tar.gz

# Verify archive integrity
tar tzf backups/uploads_20260512_143022.tar.gz > /dev/null && echo "✓ Archive OK"
tar tzf backups/postgres_20260512_143022.tar.gz > /dev/null && echo "✓ Archive OK"
tar tzf backups/chroma_20260512_143022.tar.gz > /dev/null && echo "✓ Archive OK"
```

### Verify Restore Success

After restoring, verify data integrity:

```bash
# Check container health
docker-compose ps

# Check backend health endpoint
curl http://localhost:8001/health

# Verify database connectivity
docker-compose exec postgres psql -U postgres -d ragdb -c "SELECT COUNT(*) FROM users;"

# Verify uploaded files exist
docker-compose exec backend ls -la /app/uploads

# Test document retrieval
curl -X GET http://localhost:8001/api/docs \
  -H "Authorization: Bearer <your-token>"
```

---

## Backup Storage

### Local Storage

Backups are stored in `./backups/` directory by default.

**Disk space requirements:**
- Estimate: 35GB per backup (10GB uploads + 5GB postgres + 20GB chroma)
- Compressed: ~15-20GB per backup (depending on data)
- Retention: Adjust based on available disk space

### Remote Storage

For production, copy backups to remote storage:

```bash
# AWS S3
aws s3 sync ./backups/ s3://your-bucket/rag-chatbot-backups/

# Google Cloud Storage
gsutil -m rsync -r ./backups/ gs://your-bucket/rag-chatbot-backups/

# Azure Blob Storage
az storage blob upload-batch -d rag-chatbot-backups -s ./backups/

# Rsync to remote server
rsync -avz ./backups/ user@backup-server:/backups/rag-chatbot/
```

---

## Automated Backup with Cron

### Linux/Mac

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/rag-chatbot && ./backups/backup-volumes.sh >> /var/log/rag-backup.log 2>&1

# Hourly backup (last 24 hours only)
0 * * * * cd /path/to/rag-chatbot && ./backups/backup-volumes.sh >> /var/log/rag-backup.log 2>&1
```

### Windows Task Scheduler

Create a scheduled task:

```powershell
# Create task to run daily at 2 AM
$action = New-ScheduledTaskAction -Execute "bash" -Argument "C:\path\to\rag-chatbot\backups\backup-volumes.sh"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "RAG Chatbot Backup"
```

---

## Cleanup Old Backups

Remove old backups to free disk space:

```bash
# Remove backups older than 30 days
find ./backups/ -name "*.tar.gz" -mtime +30 -delete

# Keep only last 10 backups
ls -t ./backups/*.tar.gz | tail -n +11 | xargs rm -f
```

---

## Troubleshooting

### Backup Fails

**Issue**: "No space left on device"
```bash
# Check disk space
df -h

# Clean up old backups
find ./backups/ -name "*.tar.gz" -mtime +7 -delete

# Clean up Docker system
docker system prune -a
```

**Issue**: "Volume not found"
```bash
# List volumes
docker volume ls | grep rag

# Verify volume names in docker-compose.yml
grep "name:" docker-compose.yml
```

### Restore Fails

**Issue**: "Archive is corrupted"
```bash
# Verify archive integrity
tar tzf backups/postgres_20260512_143022.tar.gz

# If corrupted, use previous backup
./backups/restore-volumes.sh <previous-timestamp>
```

**Issue**: "Permission denied"
```bash
# Make scripts executable
chmod +x backups/*.sh

# Run with sudo if needed (Linux)
sudo ./backups/restore-volumes.sh 20260512_143022
```

---

## Best Practices

1. **Test restores regularly** - Verify backups work before you need them
2. **Store backups off-site** - Don't keep backups only on the same server
3. **Encrypt sensitive backups** - Use GPG or similar for production data
4. **Monitor backup success** - Set up alerts for failed backups
5. **Document recovery procedures** - Ensure team knows how to restore
6. **Automate backups** - Use cron or scheduled tasks
7. **Verify backup integrity** - Check archives aren't corrupted
8. **Keep multiple versions** - Don't rely on a single backup

---

## Emergency Contacts

For backup/restore issues:
- Check logs: `docker-compose logs`
- Review this documentation
- Contact system administrator
- Check GitHub issues for known problems
