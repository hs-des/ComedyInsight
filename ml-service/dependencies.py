from __future__ import annotations

import time
from typing import Dict

from fastapi import Depends, HTTPException, Request, status

from .config import get_settings

settings = get_settings()

_rate_limiter_state: Dict[str, Dict[str, float]] = {}
_otp_rate_state: Dict[str, Dict[str, float]] = {}


async def admin_required(request: Request) -> str:
    header = request.headers.get("Authorization")
    if settings.admin_api_token:
        if not header or not header.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin token required")
        token = header.removeprefix("Bearer ").strip()
        if token != settings.admin_api_token:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin token")
    return request.headers.get("X-Admin-User", "admin")


async def rate_limiter(request: Request) -> None:
    identifier = request.client.host if request.client else "unknown"
    bucket = _rate_limiter_state.setdefault(identifier, {"count": 0, "reset": time.time() + settings.rate_limit_window})
    current_time = time.time()

    if current_time > bucket["reset"]:
        bucket["count"] = 0
        bucket["reset"] = current_time + settings.rate_limit_window

    if bucket["count"] >= settings.rate_limit_requests:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")

    bucket["count"] += 1


async def admin_with_rate_limit(request: Request, _: None = Depends(rate_limiter)) -> str:
    return await admin_required(request)


async def otp_rate_limit(request: Request) -> None:
    identifier = request.client.host if request.client else "unknown"
    bucket = _otp_rate_state.setdefault(identifier, {"count": 0, "reset": time.time() + settings.otp_resend_interval_seconds})
    current_time = time.time()

    window = settings.otp_resend_interval_seconds
    max_requests = max(1, int(settings.otp_rate_limit_per_hour * window / 3600))

    if current_time > bucket["reset"]:
        bucket["count"] = 0
        bucket["reset"] = current_time + window

    if bucket["count"] >= max_requests:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many OTP requests. Slow down.")

    bucket["count"] += 1

