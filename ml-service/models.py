from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class SettingsVersion(Base):
    __tablename__ = "settings_versions"
    __table_args__ = (UniqueConstraint("version", name="uq_settings_version"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(Integer, nullable=False)
    s3_endpoint = Column(String(512), nullable=False)
    s3_access_key_encrypted = Column(String(1024), nullable=False)
    s3_secret_key_encrypted = Column(String(1024), nullable=False)
    s3_bucket = Column(String(256), nullable=False)
    s3_region = Column(String(128), nullable=True)

    twilio_account_sid = Column(String(64), nullable=False)
    twilio_auth_token_encrypted = Column(String(1024), nullable=False)
    twilio_from_number = Column(String(32), nullable=False)
    twilio_verify_service_sid = Column(String(64), nullable=True)
    otp_template = Column(Text, nullable=False, default="Your verification code is {{code}}")

    theme = Column(String(32), nullable=False, default="dark")
    language = Column(String(8), nullable=False, default="en")
    api_timeout = Column(Integer, nullable=False, default=30)

    jwt_expiry = Column(Integer, nullable=False, default=900)
    password_policy = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    created_by = Column(String(128), nullable=False)


class SettingsAuditLog(Base):
    __tablename__ = "settings_audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    settings_id = Column(UUID(as_uuid=True), ForeignKey("settings_versions.id"), nullable=False)
    action = Column(String(64), nullable=False)
    actor = Column(String(128), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class PhoneOTP(Base):
    __tablename__ = "phone_otp_codes"
    __table_args__ = (UniqueConstraint("phone_number", name="uq_phone_otp_phone"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(32), nullable=False)
    code_hash = Column(String(128), nullable=False)
    code_salt = Column(String(32), nullable=False)
    method = Column(String(16), nullable=False, default="sms")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    last_sent_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=5)
    send_count = Column(Integer, nullable=False, default=1)
    rate_limit_reset_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class FileObject(Base):
    __tablename__ = "file_objects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bucket = Column(String(255), nullable=False)
    key = Column(String(1024), nullable=False)
    file_name = Column(String(512), nullable=False)
    content_type = Column(String(255), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    etag = Column(String(128), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


