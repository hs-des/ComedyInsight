from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from dependencies import otp_rate_limit
from db import get_db
from models import PhoneOTP
from otp_manager import resend_otp, send_otp, verification_status, verify_otp
from schemas import (
    ResendOTPRequest,
    SendOTPRequest,
    VerificationStatusResponse,
    VerifyOTPRequest,
)

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/send-otp")
async def send_otp_endpoint(
    request: SendOTPRequest,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(otp_rate_limit),
) -> dict:
    method = request.method.lower()
    expires_at, resend_interval = await send_otp(session, request.phone_number, method)
    return {
        "success": True,
        "message": f"OTP sent via {method.upper()}",
        "expires_at": expires_at.isoformat(),
        "resend_available_in": resend_interval,
        "method": method,
    }


@router.post("/verify-otp")
async def verify_otp_endpoint(
    request: VerifyOTPRequest,
    session: AsyncSession = Depends(get_db),
) -> dict:
    verified = await verify_otp(session, request.phone_number, request.code)
    return {
        "verified": verified,
        "message": "Phone number verified" if verified else "Verification failed",
    }


@router.post("/resend-otp")
async def resend_otp_endpoint(
    request: ResendOTPRequest,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(otp_rate_limit),
) -> dict:
    method = (request.method or settings.otp_default_method).lower()
    expires_at, resend_interval = await resend_otp(session, request.phone_number, method)
    return {
        "success": True,
        "message": f"OTP resent via {method.upper()}",
        "expires_at": expires_at.isoformat(),
        "resend_available_in": resend_interval,
        "method": method,
    }


@router.get("/verification-status", response_model=VerificationStatusResponse)
async def verification_status_endpoint(
    phone_number: str = Query(..., regex=r"^\+\d{8,15}$"),
    session: AsyncSession = Depends(get_db),
) -> VerificationStatusResponse:
    record: PhoneOTP = await verification_status(session, phone_number)
    return VerificationStatusResponse(
        phone_number=record.phone_number,
        verified=record.verified_at is not None,
        method=record.method,
        attempts=record.attempts,
        max_attempts=record.max_attempts,
        expires_at=record.expires_at.isoformat() if record.expires_at else None,
        last_sent_at=record.last_sent_at.isoformat() if record.last_sent_at else None,
    )

