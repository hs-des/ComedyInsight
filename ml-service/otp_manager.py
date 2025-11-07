from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models import PhoneOTP
from otp_utils import generate_code, generate_salt, hash_code, verify_code
from twilio_service import TwilioOTPService

settings = get_settings()


async def _get_record(session: AsyncSession, phone_number: str) -> Optional[PhoneOTP]:
    result = await session.execute(select(PhoneOTP).where(PhoneOTP.phone_number == phone_number))
    return result.scalar_one_or_none()


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def send_otp(session: AsyncSession, phone_number: str, method: str) -> Tuple[datetime, int]:
    now = _now()
    record = await _get_record(session, phone_number)
    creating = False

    if record is None:
        creating = True
        record = PhoneOTP(
            phone_number=phone_number,
            attempts=0,
            max_attempts=settings.otp_max_attempts,
            send_count=0,
            rate_limit_reset_at=now + timedelta(hours=1),
        )
        session.add(record)
    else:
        if record.rate_limit_reset_at is None:
            record.rate_limit_reset_at = now + timedelta(hours=1)
            record.send_count = 0
        if record.rate_limit_reset_at <= now:
            record.send_count = 0
            record.rate_limit_reset_at = now + timedelta(hours=1)
        if (record.send_count or 0) >= settings.otp_rate_limit_per_hour:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="OTP rate limit exceeded. Try again later.")
        if not creating and record.last_sent_at and (now - record.last_sent_at).total_seconds() < settings.otp_resend_interval_seconds:
            remaining = settings.otp_resend_interval_seconds - int((now - record.last_sent_at).total_seconds())
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=f"Please wait {remaining}s before requesting a new code.")

    code = generate_code(settings.otp_code_length)
    salt = generate_salt()
    record.code_hash = hash_code(code, salt)
    record.code_salt = salt
    record.method = method
    record.expires_at = now + timedelta(seconds=settings.otp_ttl_seconds)
    record.last_sent_at = now
    record.verified_at = None
    record.attempts = 0
    record.send_count = (record.send_count or 0) + 1

    twilio = await TwilioOTPService.from_session(session)
    try:
        await twilio.send_code(phone_number, code, method)
        await session.commit()
    except Exception:
        await session.rollback()
        raise

    return record.expires_at, settings.otp_resend_interval_seconds


async def verify_otp(session: AsyncSession, phone_number: str, code: str) -> bool:
    record = await _get_record(session, phone_number)
    now = _now()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No OTP request found.")
    if record.verified_at:
        return True
    if now > record.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP code expired. Request a new code.")
    if record.attempts >= record.max_attempts:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Maximum verification attempts exceeded.")

    if not verify_code(code, record.code_salt, record.code_hash):
        record.attempts += 1
        await session.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code.")

    record.verified_at = now
    record.attempts += 1
    await session.commit()
    return True


async def resend_otp(session: AsyncSession, phone_number: str, method: str) -> Tuple[datetime, int]:
    record = await _get_record(session, phone_number)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No OTP request found.")
    chosen_method = method or record.method
    return await send_otp(session, phone_number, chosen_method)


async def verification_status(session: AsyncSession, phone_number: str) -> PhoneOTP:
    record = await _get_record(session, phone_number)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No OTP request found.")
    return record

