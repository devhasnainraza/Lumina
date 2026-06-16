import time
from collections import defaultdict
from datetime import datetime, timedelta
import uuid
import json

# Rate limiting storage (in-memory for MVP, use Redis for production)
rate_limit_storage = defaultdict(list)

# Rate limits per endpoint pattern
RATE_LIMITS = {
    "/api/docs/upload": {"limit": 10, "window": 60},  # 10 uploads per minute
    "/api/docs": {"limit": 60, "window": 60},  # 60 reads per minute
    "/api/docs/": {"limit": 20, "window": 60},  # 20 deletes per minute (DELETE requests)
}


class CorrelationIDMiddleware:
    """ASGI Middleware to add correlation IDs to requests for distributed tracing"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract correlation ID from headers or generate a new one
        headers = dict(scope.get("headers", []))
        correlation_id_bytes = headers.get(b"x-correlation-id")
        correlation_id = correlation_id_bytes.decode() if correlation_id_bytes else str(uuid.uuid4())

        # Store in scope state for access in route handlers
        if "state" not in scope:
            scope["state"] = {}
        scope["state"]["correlation_id"] = correlation_id

        # Log request start
        from core.logging import get_logger
        logger = get_logger(__name__)
        logger.info(
            "Request started",
            extra={
                "correlation_id": correlation_id,
                "method": scope.get("method"),
                "path": scope.get("path"),
            }
        )

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                msg_headers = list(message.get("headers", []))
                msg_headers.append((b"X-Correlation-ID", correlation_id.encode()))
                message["headers"] = msg_headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


class RateLimitMiddleware:
    """ASGI Rate limiting middleware"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "")

        # Skip rate limiting for health check and root
        if path in ["/", "/health", "/docs", "/openapi.json"]:
            await self.app(scope, receive, send)
            return

        # Get user identifier (from auth header or IP)
        user_id = None
        headers = dict(scope.get("headers", []))
        auth_header = headers.get(b"authorization")
        if auth_header:
            user_id = auth_header.decode()
        else:
            client = scope.get("client")
            user_id = client[0] if client else "unknown"

        # Check rate limit
        endpoint_pattern = self._get_endpoint_pattern(path, method)
        if endpoint_pattern and endpoint_pattern in RATE_LIMITS:
            limit_config = RATE_LIMITS[endpoint_pattern]
            key = f"{user_id}:{endpoint_pattern}"

            # Clean old entries
            now = datetime.utcnow()
            cutoff = now - timedelta(seconds=limit_config["window"])
            rate_limit_storage[key] = [
                timestamp for timestamp in rate_limit_storage[key]
                if timestamp > cutoff
            ]

            # Check if limit exceeded
            if len(rate_limit_storage[key]) >= limit_config["limit"]:
                response_body = json.dumps({
                    "detail": {
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many requests. Please try again later.",
                            "retry_after": limit_config["window"]
                        }
                    }
                }).encode("utf-8")
                
                await send({
                    "type": "http.response.start",
                    "status": 429,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(response_body)).encode())
                    ]
                })
                await send({
                    "type": "http.response.body",
                    "body": response_body,
                    "more_body": False
                })
                return

            # Add current request
            rate_limit_storage[key].append(now)

        await self.app(scope, receive, send)

    def _get_endpoint_pattern(self, path: str, method: str) -> str:
        """Map request path to rate limit pattern"""
        if path == "/api/docs/upload":
            return "/api/docs/upload"
        elif path == "/api/docs" and method == "GET":
            return "/api/docs"
        elif path.startswith("/api/docs/") and method == "DELETE":
            return "/api/docs/"
        return None


class RequestLoggingMiddleware:
    """ASGI Request logging middleware"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        correlation_id = scope.get("state", {}).get("correlation_id", None)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = time.time() - start_time
                from core.logging import get_logger
                logger = get_logger(__name__)
                
                # Check status
                status_code = message.get("status")
                
                # Determine user type
                headers = dict(scope.get("headers", []))
                user_id = "authenticated" if b"authorization" in headers else None

                logger.info(
                    f"{scope.get('method')} {scope.get('path')} - {status_code} - {duration:.3f}s",
                    extra={
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "method": scope.get("method"),
                        "path": scope.get("path"),
                        "status_code": status_code,
                        "duration": duration
                    }
                )
            await send(message)

        await self.app(scope, receive, send_wrapper)
