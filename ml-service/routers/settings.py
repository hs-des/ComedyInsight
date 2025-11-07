from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import admin_with_rate_limit
from db import get_db
from schemas import (
    ApplicationConfig,
    PasswordPolicy,
    SecurityConfig,
    BackupResponse,
    RestoreRequest,
    SettingsConnectionTestRequest,
    SettingsPayload,
    SettingsResponse,
    SettingsTestStorageRequest,
    SettingsTestTwilioRequest,
    TwilioConfig,
)
from services import (
    backup_payload,
    create_settings_version,
    decrypt_settings,
    latest_settings,
    log_action,
    restore_from_backup,
    test_s3_connection,
    test_twilio_settings,
)

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    session: AsyncSession = Depends(get_db),
    _: str = Depends(admin_with_rate_limit),
) -> SettingsResponse:
    record = await latest_settings(session)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settings not configured")
    payload = decrypt_settings(record)
    return SettingsResponse(version=record.version, **payload.dict())


@router.put("", response_model=SettingsResponse)
async def update_settings(
    payload: SettingsPayload,
    session: AsyncSession = Depends(get_db),
    actor: str = Depends(admin_with_rate_limit),
) -> SettingsResponse:
    record = await create_settings_version(session, payload, actor, notes="manual update")
    return SettingsResponse(version=record.version, **decrypt_settings(record).dict())


@router.post("/test-s3")
async def test_s3(
    payload: SettingsTestStorageRequest,
    actor: str = Depends(admin_with_rate_limit),
) -> Dict[str, Any]:
    dummy_twilio = TwilioConfig(
        account_sid="AC" + "0" * 32,
        auth_token="dummy_token_dummy_token",
        phone_number="+10000000000",
        otp_template="Your code is {{code}}",
        verify_service_sid=None,
    )
    dummy_application = ApplicationConfig(theme="dark", language="en", api_timeout=30)
    dummy_security = SecurityConfig(password_policy=PasswordPolicy())
    success, message = test_s3_connection(
        SettingsPayload(
            storage=payload,
            twilio=dummy_twilio,
            application=dummy_application,
            security=dummy_security,
        )
    )
    return {"success": success, "message": message, "tested_by": actor}


@router.post("/test-twilio")
async def test_twilio(
    payload: SettingsTestTwilioRequest,
    actor: str = Depends(admin_with_rate_limit),
) -> Dict[str, Any]:
    dummy_storage = SettingsTestStorageRequest(
        endpoint="http://localhost:9000",
        access_key="dummy",
        secret_key="dummysecret",
        bucket="dummy",
        region="us-east-1",
    )
    dummy_application = ApplicationConfig(theme="dark", language="en", api_timeout=30)
    dummy_security = SecurityConfig(password_policy=PasswordPolicy())
    success, message = test_twilio_settings(
        SettingsPayload(
            storage=dummy_storage,
            twilio=payload,
            application=dummy_application,
            security=dummy_security,
        ),
        phone_number=payload.phone_number,
    )
    return {"success": success, "message": message, "tested_by": actor}


@router.post("/test-connection")
async def test_connection(
    payload: SettingsConnectionTestRequest,
    actor: str = Depends(admin_with_rate_limit),
) -> Dict[str, Any]:
    service = payload.service.lower()
    data = payload.payload or {}

    if service in {"s3", "storage"}:
        storage_payload = SettingsTestStorageRequest(**data)
        response = await test_s3(storage_payload, actor)
        return {**response, "service": "s3"}

    if service in {"twilio", "otp"}:
        twilio_payload = SettingsTestTwilioRequest(**data)
        response = await test_twilio(twilio_payload, actor)
        return {**response, "service": "twilio"}

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported service '{payload.service}'")


@router.post("/backup", response_model=BackupResponse)
async def backup_settings(
    session: AsyncSession = Depends(get_db),
    actor: str = Depends(admin_with_rate_limit),
) -> BackupResponse:
    record, payload = await backup_payload(session)
    await log_action(session, record.id, "backup", actor)
    return BackupResponse(version=record.version, data=payload)


@router.post("/restore", response_model=SettingsResponse)
async def restore_settings(
    payload: RestoreRequest,
    session: AsyncSession = Depends(get_db),
    actor: str = Depends(admin_with_rate_limit),
) -> SettingsResponse:
    record = await restore_from_backup(session, payload.data, actor, notes=f"restore version {payload.version or 'n/a'}")
    return SettingsResponse(version=record.version, **decrypt_settings(record).dict())

