from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
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


class Artist(Base):
    __tablename__ = "artists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


video_artists = Table(
    "video_artists",
    Base.metadata,
    Column("video_id", UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True),
    Column("artist_id", UUID(as_uuid=True), ForeignKey("artists.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), nullable=False, default=datetime.utcnow),
)


video_categories = Table(
    "video_categories",
    Base.metadata,
    Column("video_id", UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime(timezone=True), nullable=False, default=datetime.utcnow),
)


class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(512), nullable=True)
    video_url = Column(String(1024), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    status = Column(String(64), nullable=False, default="draft")
    release_date = Column(Date, nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    metadata = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Subtitle(Base):
    __tablename__ = "subtitles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(16), nullable=False)
    label = Column(String(128), nullable=True)
    file_url = Column(String(1024), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price_cents = Column(Integer, nullable=False, default=0)
    currency = Column(String(3), nullable=False, default="USD")
    billing_interval = Column(String(32), nullable=False, default="monthly")
    trial_days = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    metadata = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(32), nullable=False, default="active")
    started_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    renewal_price_cents = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ServiceSetting(Base):
    __tablename__ = "service_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service = Column(String(128), nullable=False, unique=True)
    value = Column(JSON, nullable=False, default=dict)
    updated_by = Column(String(128), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


