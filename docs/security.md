# Security Best Practices

**Feature**: Production Infrastructure - Security & Configuration  
**Last Updated**: 2026-05-12

## Overview

This document outlines security best practices for deploying and operating the RAG Chatbot in production environments. Security is a shared responsibility between the application, infrastructure, and operational practices.

## Secret Management

### Environment Variables

**DO ✅**:
- Store secrets in environment variables, never in code
- Use `.env` file for local development only
- Use secrets management systems for production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets regularly (every 90 days minimum)
- Use different secrets for each environment (dev, staging, production)
- Generate cryptographically secure random values for secrets

**DON'T ❌**:
- Never commit `.env` files to version control
- Never hardcode API keys, passwords, or tokens in code
- Never share secrets via email, Slack, or other insecure channels
- Never reuse secrets across environments
- Never log secret values

### Generating Secure Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Database Password (16+ characters with special chars)
openssl rand -base64 24

# API Key (if generating your own)
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Secret Rotation

**Frequency**:
- JWT_SECRET: Every 90 days
- Database passwords: Every 180 days
- API keys: When compromised or annually

**Process**:
1. Generate new secret
2. Update in secrets manager
3. Deploy new configuration
4. Verify application works with new secret
5. Revoke old secret after grace period

---

## Authentication & Authorization

### JWT Tokens

**Configuration**:
- Use HS256 algorithm (default)
- Set appropriate expiration (24 hours default)
- Include minimal claims (user_id, exp, iat)
- Never include sensitive data in JWT payload

**Token Storage** (Frontend):
- Store in HTTP-only cookies (preferred)
- Or use secure localStorage with XSS protection
- Never store in regular cookies or sessionStorage

**Token Validation**:
- Validate signature on every request
- Check expiration time
- Verify issuer and audience claims
- Implement token refresh mechanism

### Password Security

**Hashing**:
- Use bcrypt with cost factor 12+ (implemented)
- Never store plaintext passwords
- Never log passwords or hashes

**Password Requirements**:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Consider special characters
- Implement password strength meter

---

## API Security

### Rate Limiting

**Current Implementation**:
- 10 uploads per minute per user
- 60 reads per minute per user
- 20 deletes per minute per user

**Production Recommendations**:
- Use Redis for distributed rate limiting
- Implement exponential backoff
- Add IP-based rate limiting
- Monitor for abuse patterns

### Input Validation

**File Uploads**:
- ✅ Validate file type (MIME type + magic bytes)
- ✅ Enforce size limits (10MB default)
- ✅ Sanitize filenames
- ✅ Scan for malware (recommended for production)

**API Requests**:
- ✅ Validate all input with Pydantic models
- ✅ Sanitize user input
- ✅ Reject malformed requests
- ✅ Implement request size limits

### CORS Configuration

**Current**: Allows all origins (`*`) - **INSECURE for production**

**Production Configuration**:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://app.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## Container Security

### Non-Root Users

**Current Implementation**: ✅ Backend runs as `appuser` (UID 1000)

**Verification**:
```bash
# Check user in running container
docker-compose exec backend whoami
# Should output: appuser

# Check process owner
docker-compose exec backend ps aux
# Should show appuser, not root
```

### Image Security

**Best Practices**:
- ✅ Use official base images (python:3.11-slim)
- ✅ Multi-stage builds to exclude build dependencies
- ✅ Minimal runtime dependencies
- ⚠️ Scan images for vulnerabilities

**Vulnerability Scanning**:

```bash
# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image rag-backend:latest

# Scan with Snyk
snyk container test rag-backend:latest

# Scan with Docker Scout
docker scout cves rag-backend:latest
```

### Container Isolation

**Network Isolation**:
- ✅ Internal services (postgres, chromadb) not exposed to host
- ✅ Custom bridge network for service communication
- ✅ Only frontend and backend expose ports

**Resource Limits**:

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

---

## Data Security

### Data at Rest

**Database Encryption**:
- Use encrypted volumes (AWS EBS encryption, etc.)
- Enable PostgreSQL SSL/TLS connections
- Encrypt backups before storing

**File Storage**:
- Uploaded documents stored in Docker volumes
- Consider encryption for sensitive documents
- Implement access controls on volume mounts

### Data in Transit

**HTTPS/TLS**:
- Use reverse proxy (Nginx, Traefik) for TLS termination
- Enforce HTTPS in production
- Use valid SSL certificates (Let's Encrypt)
- Disable HTTP (redirect to HTTPS)

**Database Connections**:
```bash
# Enable SSL for PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db?ssl=require
```

### Data Isolation

**Multi-Tenancy**:
- ✅ User data isolated by user_id in all queries
- ✅ JWT validation ensures user can only access own data
- ✅ No cross-user data leakage

**Verification**:
```bash
# Test with different user tokens
TOKEN_USER1="..."
TOKEN_USER2="..."

# User 1 uploads document
curl -X POST http://localhost:8001/api/docs/upload \
  -H "Authorization: Bearer $TOKEN_USER1" \
  -F "file=@test.pdf"

# User 2 should NOT see User 1's documents
curl -X GET http://localhost:8001/api/docs \
  -H "Authorization: Bearer $TOKEN_USER2"
```

---

## Logging Security

### What NOT to Log

**Never log**:
- ❌ Passwords or password hashes
- ❌ API keys or secrets
- ❌ JWT tokens (full tokens)
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ Personal health information
- ❌ Full request/response bodies (may contain sensitive data)

### What TO Log

**Safe to log**:
- ✅ User IDs (not usernames if sensitive)
- ✅ Document IDs
- ✅ Request paths and methods
- ✅ Response status codes
- ✅ Error messages (sanitized)
- ✅ Performance metrics
- ✅ Correlation IDs

### Log Access Control

**Recommendations**:
- Restrict log access to authorized personnel only
- Use log aggregation with access controls (ELK, Splunk)
- Implement log retention policies
- Audit log access

---

## Dependency Security

### Vulnerability Scanning

```bash
# Scan Python dependencies
pip install safety
safety check -r backend/requirements.txt

# Scan with pip-audit
pip install pip-audit
pip-audit -r backend/requirements.txt

# Scan with Snyk
snyk test --file=backend/requirements.txt
```

### Dependency Updates

**Process**:
1. Monitor for security advisories
2. Test updates in development
3. Deploy to staging
4. Verify functionality
5. Deploy to production

**Automation**:
- Use Dependabot or Renovate for automated PRs
- Set up security alerts in GitHub
- Review and merge security updates promptly

---

## Deployment Security

### Docker Compose

**Production Hardening**:

```yaml
services:
  backend:
    # Security options
    security_opt:
      - no-new-privileges:true
    # Read-only root filesystem
    read_only: true
    tmpfs:
      - /tmp
    # Drop capabilities
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

### Reverse Proxy

**Nginx Configuration**:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to backend
    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Monitoring & Alerting

### Security Monitoring

**Monitor for**:
- Failed authentication attempts
- Unusual API usage patterns
- High error rates
- Unauthorized access attempts
- Suspicious file uploads

**Alerting Rules**:
```yaml
# Example Prometheus alert
- alert: HighFailedAuthRate
  expr: rate(auth_failures[5m]) > 10
  annotations:
    summary: "High rate of failed authentication attempts"

- alert: UnusualFileUploadSize
  expr: file_upload_size_bytes > 50000000
  annotations:
    summary: "Unusually large file upload detected"
```

### Incident Response

**Process**:
1. Detect security incident
2. Contain the threat
3. Investigate root cause
4. Remediate vulnerabilities
5. Document lessons learned
6. Update security measures

---

## Compliance

### GDPR Considerations

**User Rights**:
- Right to access data
- Right to deletion
- Right to data portability
- Right to rectification

**Implementation**:
- Provide API endpoints for data export
- Implement user deletion (cascade to all related data)
- Log data access for audit trails
- Obtain consent for data processing

### Data Retention

**Recommendations**:
- Define retention policies for each data type
- Implement automated data deletion
- Document retention periods
- Provide user controls for data deletion

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets rotated from defaults
- [ ] JWT_SECRET is 32+ characters
- [ ] Database password is strong
- [ ] CORS configured for production domains
- [ ] HTTPS/TLS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Dependency vulnerabilities scanned
- [ ] Container images scanned
- [ ] Non-root users configured
- [ ] Resource limits set
- [ ] Logging configured (no secrets logged)
- [ ] Monitoring and alerting set up

### Post-Deployment

- [ ] Verify HTTPS works
- [ ] Test authentication flows
- [ ] Verify multi-tenant isolation
- [ ] Test rate limiting
- [ ] Verify file upload restrictions
- [ ] Check security headers
- [ ] Review logs for errors
- [ ] Test backup/restore procedures
- [ ] Verify monitoring alerts work
- [ ] Document incident response procedures

---

## Security Contacts

**Report Security Issues**:
- Email: security@yourdomain.com
- Encrypted: Use PGP key (provide key)
- Bug Bounty: Link to program (if applicable)

**Response Time**:
- Critical: 4 hours
- High: 24 hours
- Medium: 1 week
- Low: 2 weeks

---

## Related Documentation

- [Environment Variables](./environment-variables.md) - Configuration reference
- [Deployment Guide](./deployment.md) - Complete deployment instructions
- [Health Checks](./health-checks.md) - Service monitoring
- [Logging](./logging.md) - Logging configuration
