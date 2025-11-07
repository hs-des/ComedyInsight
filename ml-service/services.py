from __future__ import annotations

from typing import Optional, Tuple
from uuid import UUID

import boto3
from sqlalchemy import desc, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from twilio.base.exceptions import TwilioException
from twilio.rest import Client as TwilioClient

from .config import get_settings
from .encryption import decrypt_value, encrypt_value
from .models import SettingsAuditLog, SettingsVersion
from .schemas import SettingsPayload

settings = get_settings()


async def latest_settings(session: AsyncSession) -> Optional[SettingsVersion]:
    result = await session.execute(select(SettingsVersion).order_by(desc(SettingsVersion.version)).limit(1))
    return result.scalar_one_or_none()


def decrypt_settings(record: SettingsVersion) -> SettingsPayload:
    return SettingsPayload(
        storage={
            "endpoint": record.s3_endpoint,
            "access_key": decrypt_value(record.s3_access_key_encrypted) or "",
            "secret_key": decrypt_value(record.s3_secret_key_encrypted) or "",
            "bucket": record.s3_bucket,
            "region": record.s3_region,
        },
        twilio={
            "account_sid": record.twilio_account_sid,
            "auth_token": decrypt_value(record.twilio_auth_token_encrypted) or "",
            "phone_number": record.twilio_from_number,
            "verify_service_sid": record.twilio_verify_service_sid,
            "otp_template": record.otp_template,
        },
        application={
            "theme": record.theme,
            "language": record.language,
            "api_timeout": record.api_timeout,
        },
        security={
            "jwt_expiry": record.jwt_expiry,
            "password_policy": record.password_policy or {},
        },
    )


async def create_settings_version(
    session: AsyncSession,
    payload: SettingsPayload,
    actor: str,
    notes: Optional[str] = None,
) -> SettingsVersion:
    existing = await latest_settings(session)
    next_version = 1 if existing is None else existing.version + 1

    record = SettingsVersion(
        version=next_version,
        s3_endpoint=str(payload.storage.endpoint),
        s3_access_key_encrypted=encrypt_value(payload.storage.access_key),
        s3_secret_key_encrypted=encrypt_value(payload.storage.secret_key),
        s3_bucket=payload.storage.bucket,
        s3_region=payload.storage.region,
        twilio_account_sid=payload.twilio.account_sid,
        twilio_auth_token_encrypted=encrypt_value(payload.twilio.auth_token),
        twilio_from_number=payload.twilio.phone_number,
        twilio_verify_service_sid=payload.twilio.verify_service_sid,
        otp_template=payload.twilio.otp_template,
        theme=payload.application.theme,
        language=payload.application.language,
        api_timeout=payload.application.api_timeout,
        jwt_expiry=payload.security.jwt_expiry,
        password_policy=payload.security.password_policy.dict(),
        created_by=actor,
    )
    session.add(record)
    await session.flush()

    audit = SettingsAuditLog(
        settings_id=record.id,
        action="update",
        actor=actor,
        notes=notes,
    )
    session.add(audit)
    await session.commit()
    return record


async def backup_payload(session: AsyncSession) -> Tuple[SettingsVersion, SettingsPayload]:
    record = await latest_settings(session)
    if not record:
        raise NoResultFound("No settings available")
    payload = decrypt_settings(record)
    return record, payload


async def restore_from_backup(session: AsyncSession, payload: SettingsPayload, actor: str, notes: Optional[str] = None) -> SettingsVersion:
    return await create_settings_version(session, payload, actor, notes or "restore")


def test_s3_connection(payload: SettingsPayload) -> Tuple[bool, str]:
    try:
        session = boto3.session.Session(
            aws_access_key_id=payload.storage.access_key,
            aws_secret_access_key=payload.storage.secret_key,
            region_name=payload.storage.region or "us-east-1",
        )
        client = session.client(
            "s3",
            endpoint_url=str(payload.storage.endpoint),
        )
        client.list_buckets()
        return True, "Connection successful"
    except Exception as exc:  # noqa: BLE001
        return False, f"S3 connection failed: {exc}"


def test_twilio_settings(payload: SettingsPayload, phone_number: Optional[str] = None) -> Tuple[bool, str]:
    try:
        client = TwilioClient(payload.twilio.account_sid, payload.twilio.auth_token)
        # Verify credentials by fetching account
        client.api.accounts(payload.twilio.account_sid).fetch()
        if payload.twilio.verify_service_sid and phone_number:
            verification = client.verify.v2.services(payload.twilio.verify_service_sid).verifications.create(to=phone_number, channel="sms")
            return True, f"OTP dispatch status: {verification.status}"
        return True, "Twilio credentials validated"
    except TwilioException as exc:
        return False, f"Twilio validation failed: {exc}"
    except Exception as exc:  # noqa: BLE001
        return False, f"Unexpected error: {exc}"


async def log_action(session: AsyncSession, settings_id: UUID, action: str, actor: str, notes: Optional[str] = None) -> None:
    audit = SettingsAuditLog(settings_id=settings_id, action=action, actor=actor, notes=notes)
    session.add(audit)
    await session.commit()

