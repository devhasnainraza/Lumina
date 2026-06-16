# Logging Configuration

**Feature**: Production Infrastructure - Observability & Monitoring  
**Last Updated**: 2026-05-12

## Overview

The RAG Chatbot uses structured JSON logging with correlation IDs for distributed tracing and operational visibility. All logs are written to stdout and can be collected by Docker, log aggregation systems, or monitoring platforms.

## Log Format

### Structured JSON Logs

All logs are formatted as JSON for machine parsing:

```json
{
  "timestamp": "2026-05-12T14:30:22.123456",
  "level": "INFO",
  "logger": "api.routes.documents",
  "message": "Document uploaded successfully",
  "module": "documents",
  "function": "upload_document",
  "line": 45,
  "correlation_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user_123",
  "document_id": "doc_456"
}
```

### Log Fields

| Field | Type | Description | Always Present |
|-------|------|-------------|----------------|
| `timestamp` | string | ISO 8601 timestamp | Yes |
| `level` | string | Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL) | Yes |
| `logger` | string | Logger name (module path) | Yes |
| `message` | string | Log message | Yes |
| `module` | string | Python module name | Yes |
| `function` | string | Function name | Yes |
| `line` | number | Line number in source file | Yes |
| `correlation_id` | string | Request correlation ID (UUID) | When available |
| `user_id` | string | Authenticated user ID | When available |
| `document_id` | string | Document ID | When relevant |
| `request_id` | string | Request ID | When available |
| `exception` | string | Exception traceback | On errors |

---

## Correlation IDs

### What Are Correlation IDs?

Correlation IDs are unique identifiers (UUIDs) attached to each request that flow through all services and log entries. They enable tracing a single request across multiple services and log entries.

### How They Work

1. **Client sends request** (optionally with `X-Correlation-ID` header)
2. **CorrelationIDMiddleware** generates or extracts correlation ID
3. **Correlation ID stored** in request state
4. **All log entries** for that request include the correlation ID
5. **Response includes** `X-Correlation-ID` header

### Example Flow

```bash
# Client sends request with correlation ID
curl -H "X-Correlation-ID: my-trace-123" \
  http://localhost:8001/api/docs

# All logs for this request include correlation_id: "my-trace-123"
# Response includes: X-Correlation-ID: my-trace-123
```

### Tracing Requests

```bash
# View all logs for a specific request
docker-compose logs backend | grep "my-trace-123"

# Extract correlation ID from response
CORRELATION_ID=$(curl -sI http://localhost:8001/api/docs | grep -i x-correlation-id | cut -d' ' -f2)

# Trace that request in logs
docker-compose logs backend | grep "$CORRELATION_ID"
```

---

## Log Levels

### Level Definitions

| Level | When to Use | Example |
|-------|-------------|---------|
| **DEBUG** | Detailed diagnostic information | Variable values, function entry/exit |
| **INFO** | General informational messages | Request started, document uploaded |
| **WARNING** | Warning messages for recoverable issues | Deprecated API usage, retry attempts |
| **ERROR** | Error messages for failures | Database connection failed, file not found |
| **CRITICAL** | Critical errors requiring immediate attention | Service crash, data corruption |

### Setting Log Level

**Environment Variable**:
```bash
# In .env file
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR, CRITICAL
```

**Runtime Configuration**:
```python
from core.logging import setup_logging

# Set log level
setup_logging(level="DEBUG")
```

---

## Viewing Logs

### Docker Compose

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs from specific service
docker-compose logs backend
docker-compose logs postgres

# View last 100 lines
docker-compose logs --tail=100 backend

# View logs with timestamps
docker-compose logs -f --timestamps backend

# Filter logs by level
docker-compose logs backend | grep '"level":"ERROR"'

# Filter logs by correlation ID
docker-compose logs backend | grep '"correlation_id":"abc-123"'
```

### Docker Container

```bash
# View logs from running container
docker logs rag-backend

# Follow logs
docker logs -f rag-backend

# View last 50 lines
docker logs --tail=50 rag-backend

# View logs since specific time
docker logs --since=1h rag-backend
```

### Parse JSON Logs

```bash
# Pretty print JSON logs
docker-compose logs backend | grep '{' | jq

# Extract specific fields
docker-compose logs backend | grep '{' | jq -r '.message'

# Filter by log level
docker-compose logs backend | grep '{' | jq 'select(.level=="ERROR")'

# Filter by user
docker-compose logs backend | grep '{' | jq 'select(.user_id=="user_123")'

# Count errors
docker-compose logs backend | grep '{' | jq 'select(.level=="ERROR")' | wc -l
```

---

## Log Rotation

### Docker Log Rotation

Configured in `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"    # Maximum log file size
        max-file: "3"      # Number of log files to retain
```

**Total log storage**: 10MB × 3 files = 30MB per service

### Manual Log Cleanup

```bash
# Clear all Docker logs
docker-compose down
docker system prune -a

# Clear logs for specific container
docker logs rag-backend > /dev/null 2>&1
```

---

## Log Aggregation

### Fluentd

Example Fluentd configuration:

```xml
<source>
  @type forward
  port 24224
</source>

<filter docker.**>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<match docker.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
</match>
```

### Logstash

Example Logstash configuration:

```ruby
input {
  docker {
    host => "unix:///var/run/docker.sock"
    codec => json
  }
}

filter {
  json {
    source => "message"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "rag-chatbot-%{+YYYY.MM.dd}"
  }
}
```

### CloudWatch Logs

Update `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "awslogs"
      options:
        awslogs-region: "us-east-1"
        awslogs-group: "rag-chatbot"
        awslogs-stream: "backend"
```

---

## Monitoring & Alerting

### Error Rate Monitoring

```bash
# Count errors in last hour
docker logs --since=1h rag-backend | grep '"level":"ERROR"' | wc -l

# Alert if error rate exceeds threshold
ERROR_COUNT=$(docker logs --since=5m rag-backend | grep '"level":"ERROR"' | wc -l)
if [ $ERROR_COUNT -gt 10 ]; then
  echo "ALERT: High error rate detected"
fi
```

### Log-Based Alerts

**Prometheus Alerting Rule**:

```yaml
groups:
  - name: rag-chatbot
    rules:
      - alert: HighErrorRate
        expr: rate(log_messages{level="ERROR"}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High error rate detected"
```

**Datadog Monitor**:

```json
{
  "name": "RAG Chatbot Error Rate",
  "type": "log alert",
  "query": "logs(\"service:rag-chatbot level:error\").index(\"*\").rollup(\"count\").last(\"5m\") > 10",
  "message": "Error rate exceeded threshold"
}
```

---

## Debugging with Logs

### Common Debugging Scenarios

**1. Trace a specific request**:

```bash
# Get correlation ID from response
CORRELATION_ID=$(curl -sI http://localhost:8001/api/docs \
  -H "Authorization: Bearer $TOKEN" | \
  grep -i x-correlation-id | cut -d' ' -f2 | tr -d '\r')

# View all logs for that request
docker-compose logs backend | grep "$CORRELATION_ID"
```

**2. Find slow requests**:

```bash
# Find requests taking longer than 1 second
docker-compose logs backend | grep '{' | \
  jq 'select(.duration > 1.0) | {path, duration, correlation_id}'
```

**3. Track user activity**:

```bash
# View all actions by specific user
docker-compose logs backend | grep '{' | \
  jq 'select(.user_id=="user_123") | {timestamp, message, path}'
```

**4. Identify database issues**:

```bash
# Find database-related errors
docker-compose logs backend | grep '{' | \
  jq 'select(.message | contains("Database"))'
```

**5. Monitor document processing**:

```bash
# Track document upload and processing
docker-compose logs backend | grep '{' | \
  jq 'select(.document_id=="doc_456") | {timestamp, message}'
```

---

## Best Practices

1. **Always include correlation IDs** - Makes distributed tracing possible
2. **Use structured logging** - JSON format enables machine parsing
3. **Log at appropriate levels** - Don't log everything at INFO
4. **Include context** - Add user_id, document_id, etc. to logs
5. **Don't log sensitive data** - Never log passwords, API keys, tokens
6. **Use log aggregation** - Centralize logs for production systems
7. **Set up alerts** - Monitor error rates and critical events
8. **Rotate logs** - Prevent disk space exhaustion
9. **Test log queries** - Verify you can find what you need
10. **Document log patterns** - Help team understand log structure

---

## Security Considerations

### What NOT to Log

- ❌ Passwords or password hashes
- ❌ API keys or secrets
- ❌ JWT tokens
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ Personal health information
- ❌ Full request/response bodies (may contain sensitive data)

### What TO Log

- ✅ User IDs (not usernames if sensitive)
- ✅ Document IDs
- ✅ Request paths and methods
- ✅ Response status codes
- ✅ Error messages (sanitized)
- ✅ Performance metrics
- ✅ Correlation IDs

### Log Sanitization

The logging configuration automatically excludes sensitive fields. If you need to add custom sanitization:

```python
# In backend/core/logging.py
def sanitize_log_data(data: dict) -> dict:
    """Remove sensitive fields from log data"""
    sensitive_fields = ["password", "token", "api_key", "secret"]
    return {k: v for k, v in data.items() if k not in sensitive_fields}
```

---

## Troubleshooting

### Logs Not Appearing

**Issue**: No logs visible in `docker-compose logs`

**Solutions**:

```bash
# Check if container is running
docker-compose ps

# Check if logs are being written
docker-compose exec backend ls -la /proc/1/fd/1

# Verify logging configuration
docker-compose exec backend python -c "from core.logging import setup_logging; setup_logging()"
```

### JSON Parsing Errors

**Issue**: Logs not valid JSON

**Solutions**:

```bash
# Check for non-JSON output (e.g., startup messages)
docker-compose logs backend | grep -v '{'

# Filter only JSON logs
docker-compose logs backend | grep '{' | jq
```

### Missing Correlation IDs

**Issue**: Correlation IDs not appearing in logs

**Solutions**:

```bash
# Verify middleware is registered
docker-compose exec backend python -c "
from main import app
print([m.__class__.__name__ for m in app.user_middleware])
"

# Check if CorrelationIDMiddleware is present
# Should include: CorrelationIDMiddleware
```

---

## Related Documentation

- [Health Check Endpoints](./health-checks.md) - Service health monitoring
- [Deployment Guide](./deployment.md) - Complete deployment instructions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
