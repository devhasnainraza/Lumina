# Health Check Endpoints

**Feature**: Production Infrastructure - Service Health Monitoring  
**Last Updated**: 2026-05-12

## Overview

The RAG Chatbot provides health check endpoints for monitoring service availability and readiness. These endpoints enable automated monitoring, load balancer health checks, and operational visibility.

## Endpoints

### GET /health

**Purpose**: Comprehensive health check that verifies all critical dependencies.

**Use Cases**:
- Docker HEALTHCHECK directive
- Monitoring systems (Prometheus, Datadog, etc.)
- Alerting on service degradation
- Operational dashboards

**Response Format**:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T14:30:22.123456Z",
  "services": {
    "database": "connected",
    "vector_db": "connected"
  },
  "version": "1.0.0"
}
```

**Status Codes**:
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more services unhealthy

**Example Requests**:

```bash
# Check health
curl http://localhost:8001/health

# Check health with pretty output
curl http://localhost:8001/health | jq

# Check health in Docker container
docker-compose exec backend curl -f http://localhost:8000/health
```

**Healthy Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T14:30:22.123456Z",
  "services": {
    "database": "connected",
    "vector_db": "connected"
  },
  "version": "1.0.0"
}
```

**Unhealthy Response** (503):
```json
{
  "status": "unhealthy",
  "timestamp": "2026-05-12T14:30:22.123456Z",
  "services": {
    "database": "disconnected",
    "vector_db": "connected"
  },
  "version": "1.0.0"
}
```

---

### GET /ready

**Purpose**: Readiness check that indicates if the service can accept traffic.

**Use Cases**:
- Kubernetes readiness probes
- Load balancer health checks
- Rolling deployment validation
- Traffic routing decisions

**Response Format**:

```json
{
  "ready": true,
  "timestamp": "2026-05-12T14:30:22.123456Z"
}
```

**Status Codes**:
- `200 OK` - Service ready to accept traffic
- `503 Service Unavailable` - Service not ready

**Example Requests**:

```bash
# Check readiness
curl http://localhost:8001/ready

# Check readiness with status code
curl -w "\nHTTP Status: %{http_code}\n" http://localhost:8001/ready
```

**Ready Response** (200):
```json
{
  "ready": true,
  "timestamp": "2026-05-12T14:30:22.123456Z"
}
```

**Not Ready Response** (503):
```json
{
  "ready": false,
  "timestamp": "2026-05-12T14:30:22.123456Z",
  "reason": "Database not accessible"
}
```

---

## Health vs Readiness

| Aspect | /health | /ready |
|--------|---------|--------|
| **Purpose** | Overall service health | Traffic acceptance readiness |
| **Checks** | All dependencies | Critical dependencies only |
| **Use Case** | Monitoring, alerting | Load balancing, routing |
| **Failure Action** | Alert, investigate | Stop routing traffic |
| **Recovery** | Manual intervention may be needed | Automatic retry |

---

## Docker Integration

### Docker HEALTHCHECK

The backend Dockerfile includes a HEALTHCHECK directive:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

**Parameters**:
- `interval`: Check every 30 seconds
- `timeout`: Fail if check takes longer than 10 seconds
- `start-period`: Allow 40 seconds for startup before checking
- `retries`: Mark unhealthy after 3 consecutive failures

**View Health Status**:

```bash
# Check container health status
docker-compose ps

# Expected output:
# NAME            STATUS
# rag-backend     Up (healthy)
# rag-postgres    Up (healthy)
# rag-chromadb    Up (healthy)

# View health check logs
docker inspect rag-backend | jq '.[0].State.Health'
```

---

## Monitoring Integration

### Prometheus

Example Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'rag-chatbot'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:8001']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
```

### Datadog

Example Datadog check configuration:

```yaml
init_config:

instances:
  - url: http://localhost:8001/health
    name: rag-chatbot
    timeout: 5
    http_response_status_code: 200
```

### Uptime Monitoring

Services like UptimeRobot, Pingdom, or StatusCake:

- **URL**: `https://your-domain.com/health`
- **Interval**: 5 minutes
- **Timeout**: 30 seconds
- **Expected Status**: 200
- **Alert On**: Status code != 200

---

## Troubleshooting

### Health Check Fails

**Symptom**: `/health` returns 503 or times out

**Diagnosis**:

```bash
# Check which service is failing
curl http://localhost:8001/health | jq '.services'

# Check database connectivity
docker-compose exec postgres pg_isready -U postgres

# Check vector DB connectivity
curl http://localhost:8000/api/v1/heartbeat

# Check backend logs
docker-compose logs backend | grep -i "health check"
```

**Common Issues**:

1. **Database disconnected**
   ```bash
   # Restart PostgreSQL
   docker-compose restart postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

2. **Vector DB disconnected**
   ```bash
   # Restart ChromaDB
   docker-compose restart chromadb
   
   # Check ChromaDB logs
   docker-compose logs chromadb
   ```

3. **Health check timeout**
   ```bash
   # Increase timeout in Dockerfile
   HEALTHCHECK --timeout=30s ...
   
   # Rebuild container
   docker-compose up -d --build backend
   ```

---

### Readiness Check Fails

**Symptom**: `/ready` returns 503

**Diagnosis**:

```bash
# Check readiness endpoint
curl -v http://localhost:8001/ready

# Check database connectivity (critical for readiness)
docker-compose exec backend python -c "
from db.session import engine
import asyncio
async def test():
    async with engine.connect() as conn:
        await conn.execute('SELECT 1')
    print('Database OK')
asyncio.run(test())
"
```

---

## Best Practices

1. **Monitor both endpoints** - Use `/health` for alerting, `/ready` for traffic routing
2. **Set appropriate timeouts** - Health checks should complete quickly (< 10s)
3. **Don't check external APIs** - Only check dependencies you control
4. **Log health check failures** - Include context for debugging
5. **Use correlation IDs** - Track health check requests in logs
6. **Test failure scenarios** - Verify health checks detect actual failures
7. **Document expected behavior** - Team should know what each status means

---

## Load Balancer Configuration

### Nginx

```nginx
upstream backend {
    server localhost:8001;
    
    # Health check configuration
    check interval=3000 rise=2 fall=3 timeout=1000 type=http;
    check_http_send "GET /ready HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx;
}
```

### HAProxy

```haproxy
backend rag_backend
    option httpchk GET /ready
    http-check expect status 200
    server backend1 localhost:8001 check inter 5s rise 2 fall 3
```

### AWS Application Load Balancer

```yaml
HealthCheckPath: /ready
HealthCheckIntervalSeconds: 30
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
Matcher:
  HttpCode: 200
```

---

## Kubernetes Integration

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 40
  periodSeconds: 30
  timeoutSeconds: 10
  failureThreshold: 3
```

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

---

## API Reference

### Health Check Response Schema

```typescript
interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string; // ISO 8601 format
  services: {
    database: "connected" | "disconnected";
    vector_db: "connected" | "disconnected";
  };
  version: string;
}
```

### Readiness Check Response Schema

```typescript
interface ReadinessResponse {
  ready: boolean;
  timestamp: string; // ISO 8601 format
  reason?: string; // Present when ready=false
}
```

---

## Related Documentation

- [Logging Configuration](./logging.md) - Structured logging and correlation IDs
- [Deployment Guide](./deployment.md) - Complete deployment instructions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
