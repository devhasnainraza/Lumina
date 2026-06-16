# Environment Variables Reference

**Feature**: Production Infrastructure - Secure Configuration  
**Last Updated**: 2026-05-12

## Overview

The RAG Chatbot uses environment variables for all configuration, ensuring secrets are never hardcoded in the codebase. All configuration is loaded from a `.env` file or environment variables set by the deployment platform.

## Quick Start

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env

# Required: Set these three variables
GEMINI_API_KEY=your_actual_api_key_here
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=your_secure_password_here
```

---

## Required Variables

These variables **MUST** be set for the application to start.

### GEMINI_API_KEY

**Purpose**: API key for Google Gemini AI (embeddings and chat)  
**Required**: Yes  
**Default**: None  
**Example**: `AIzaSyABC123...`

**How to get**:
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create new API key
4. Copy and paste into `.env`

**Validation**:
- Must not be empty
- Must not be the placeholder value `your_gemini_api_key_here`

---

### JWT_SECRET

**Purpose**: Secret key for signing JWT authentication tokens  
**Required**: Yes  
**Default**: None  
**Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

**How to generate**:

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Validation**:
- Must not be empty
- Must not be a default/placeholder value
- Must be at least 32 characters long

**Security**: Never commit this to version control. Rotate regularly in production.

---

### DATABASE_URL

**Purpose**: PostgreSQL database connection string  
**Required**: Yes  
**Default**: `postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb`  
**Example**: `postgresql+asyncpg://user:password@host:5432/database`

**Format**: `postgresql+asyncpg://[user]:[password]@[host]:[port]/[database]`

**Docker Compose**: Uses service name `postgres` as host  
**Production**: Use managed database URL (Neon, AWS RDS, etc.)

**Validation**:
- Must not be empty
- Must start with `postgresql+asyncpg://`

---

### POSTGRES_PASSWORD

**Purpose**: PostgreSQL database password  
**Required**: Yes (for Docker Compose)  
**Default**: `postgres` (INSECURE - change in production)  
**Example**: `MySecureP@ssw0rd123`

**Security**: 
- Change from default value
- Use strong password (12+ characters, mixed case, numbers, symbols)
- Never commit to version control

---

## Optional Variables

These variables have sensible defaults but can be customized.

### Database Configuration

#### POSTGRES_USER
**Default**: `postgres`  
**Purpose**: PostgreSQL username  
**Example**: `raguser`

#### POSTGRES_DB
**Default**: `ragdb`  
**Purpose**: PostgreSQL database name  
**Example**: `rag_production`

---

### Application Configuration

#### UPLOAD_DIR
**Default**: `/app/uploads`  
**Purpose**: Directory for uploaded documents (inside container)  
**Example**: `/app/uploads`

**Note**: This is the path inside the Docker container. The volume mount is configured in `docker-compose.yml`.

#### VECTOR_DB_PATH
**Default**: `/app/data/chromadb`  
**Purpose**: ChromaDB storage path (inside container)  
**Example**: `/app/data/chromadb`

#### MAX_FILE_SIZE_MB
**Default**: `10`  
**Purpose**: Maximum file upload size in megabytes  
**Example**: `20`

**Range**: 1-100 MB recommended

#### DEBUG
**Default**: `False`  
**Purpose**: Enable debug mode (more verbose logging)  
**Example**: `True`

**Warning**: Never enable in production (exposes sensitive information)

---

### RAG Engine Configuration

#### MODEL_NAME
**Default**: `gemini-1.5-pro`  
**Purpose**: Gemini model to use for chat and embeddings  
**Options**: `gemini-1.5-pro`, `gemini-1.5-flash`

#### TEMPERATURE
**Default**: `0.1`  
**Purpose**: LLM temperature (creativity vs determinism)  
**Range**: 0.0 (deterministic) to 1.0 (creative)  
**Recommendation**: 0.0-0.3 for factual Q&A

#### TOP_K
**Default**: `5`  
**Purpose**: Number of document chunks to retrieve  
**Range**: 1-20  
**Recommendation**: 3-7 for most use cases

#### MAX_CONTEXT_TOKENS
**Default**: `6000`  
**Purpose**: Maximum tokens to send to LLM as context  
**Range**: 1000-30000  
**Note**: Higher values = more context but slower/more expensive

#### MAX_RESPONSE_TOKENS
**Default**: `1000`  
**Purpose**: Maximum tokens in LLM response  
**Range**: 100-4000  
**Note**: Higher values = longer responses

#### MIN_RELEVANCE_SCORE
**Default**: `0.7`  
**Purpose**: Minimum similarity score for retrieved chunks  
**Range**: 0.0-1.0  
**Recommendation**: 0.6-0.8 for most use cases

---

### JWT Configuration

#### JWT_ALGORITHM
**Default**: `HS256`  
**Purpose**: Algorithm for JWT signing  
**Options**: `HS256`, `HS384`, `HS512`

**Recommendation**: Keep default unless you have specific requirements

#### JWT_EXPIRATION_MINUTES
**Default**: `1440` (24 hours)  
**Purpose**: JWT token expiration time in minutes  
**Example**: `60` (1 hour), `10080` (1 week)

---

### Frontend Configuration

#### NEXT_PUBLIC_API_URL
**Default**: `http://localhost:8001`  
**Purpose**: Backend API URL for frontend  
**Example**: `https://api.yourdomain.com`

**Note**: Must be accessible from user's browser

#### NODE_ENV
**Default**: `production`  
**Purpose**: Node.js environment mode  
**Options**: `development`, `production`

---

## Environment-Specific Configuration

### Local Development

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ragdb
GEMINI_API_KEY=your_dev_api_key
JWT_SECRET=dev_secret_min_32_chars_long_abc123
POSTGRES_PASSWORD=postgres
DEBUG=True
```

### Staging

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@staging-db.example.com:5432/ragdb_staging
GEMINI_API_KEY=your_staging_api_key
JWT_SECRET=staging_secret_from_secrets_manager
POSTGRES_PASSWORD=staging_secure_password
DEBUG=False
```

### Production

```bash
DATABASE_URL=postgresql+asyncpg://user:pass@prod-db.example.com:5432/ragdb_prod
GEMINI_API_KEY=your_prod_api_key
JWT_SECRET=prod_secret_from_secrets_manager
POSTGRES_PASSWORD=prod_secure_password
DEBUG=False
MAX_FILE_SIZE_MB=20
TOP_K=7
```

---

## Validation

The application validates all required variables at startup. If validation fails, you'll see clear error messages:

```
❌ Configuration Validation Failed:

  • GEMINI_API_KEY is required. Get your API key from https://makersuite.google.com/app/apikey
  • JWT_SECRET is required and must be changed from default. Generate with: openssl rand -base64 32
  • JWT_SECRET must be at least 32 characters long for security

Please check your .env file and ensure all required variables are set correctly.
```

---

## Security Best Practices

### DO ✅

- ✅ Use `.env` file for local development
- ✅ Use secrets manager for production (AWS Secrets Manager, HashiCorp Vault)
- ✅ Generate strong, random JWT_SECRET
- ✅ Rotate secrets regularly
- ✅ Use different secrets for each environment
- ✅ Restrict access to `.env` file (chmod 600)
- ✅ Add `.env` to `.gitignore`

### DON'T ❌

- ❌ Commit `.env` to version control
- ❌ Use default/placeholder values in production
- ❌ Share secrets via email or chat
- ❌ Reuse secrets across environments
- ❌ Use weak or short JWT_SECRET
- ❌ Enable DEBUG in production
- ❌ Log environment variables

---

## Troubleshooting

### Application Won't Start

**Error**: "GEMINI_API_KEY is required"

**Solution**:
```bash
# Check if .env file exists
ls -la .env

# Check if variable is set
grep GEMINI_API_KEY .env

# Verify it's not the placeholder
cat .env | grep GEMINI_API_KEY
```

---

### Invalid JWT_SECRET

**Error**: "JWT_SECRET must be at least 32 characters long"

**Solution**:
```bash
# Generate new secret
openssl rand -base64 32

# Update .env file
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

---

### Database Connection Failed

**Error**: "Database connection failed"

**Solution**:
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test database connectivity
docker-compose exec postgres pg_isready -U postgres

# Check if postgres container is running
docker-compose ps postgres
```

---

## Cloud Platform Configuration

### Railway

Set environment variables in Railway dashboard:
- Navigate to project → Variables
- Add each variable individually
- Railway automatically restarts on variable changes

### Render

Set environment variables in Render dashboard:
- Navigate to service → Environment
- Add each variable individually
- Click "Save Changes" to apply

### Vercel (Frontend only)

Set environment variables in Vercel dashboard:
- Navigate to project → Settings → Environment Variables
- Add variables with `NEXT_PUBLIC_` prefix for client-side access
- Redeploy to apply changes

### AWS ECS

Use AWS Secrets Manager:
```json
{
  "containerDefinitions": [{
    "secrets": [
      {
        "name": "GEMINI_API_KEY",
        "valueFrom": "arn:aws:secretsmanager:region:account:secret:rag/gemini-api-key"
      }
    ]
  }]
}
```

---

## Related Documentation

- [Security Best Practices](./security.md) - Comprehensive security guide
- [Deployment Guide](./deployment.md) - Complete deployment instructions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
