from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional


class Settings:
    database_url: str
    encryption_key: str
    admin_api_token: Optional[str]
    rate_limit_requests: int
    rate_limit_window: int

    def __init__(self) -> None:
        raw_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@postgres:5432/comedyinsight",
        )
        if raw_url.startswith("postgres://"):
            raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif raw_url.startswith("postgresql://") and "+asyncpg" not in raw_url:
            raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        self.database_url = raw_url

        key = os.getenv("SETTINGS_ENCRYPTION_KEY")
        if not key:
            raise RuntimeError("SETTINGS_ENCRYPTION_KEY environment variable is required")
        # Accept raw 32-byte key or urlsafe base64 string
        self.encryption_key = key

        self.admin_api_token = os.getenv("ADMIN_API_TOKEN")
        self.rate_limit_requests = int(os.getenv("SETTINGS_RATE_LIMIT_REQUESTS", "20"))
        self.rate_limit_window = int(os.getenv("SETTINGS_RATE_LIMIT_WINDOW", "60"))

        # OTP configuration
        self.otp_code_length = int(os.getenv("OTP_CODE_LENGTH", "6"))
        self.otp_ttl_seconds = int(os.getenv("OTP_TTL_SECONDS", "300"))
        self.otp_resend_interval_seconds = int(os.getenv("OTP_RESEND_INTERVAL_SECONDS", "60"))
        self.otp_rate_limit_per_hour = int(os.getenv("OTP_RATE_LIMIT_PER_HOUR", "5"))
        self.otp_max_attempts = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
        self.otp_default_method = os.getenv("OTP_DEFAULT_METHOD", "sms").lower()


@lru_cache
def get_settings() -> Settings:
    return Settings()

