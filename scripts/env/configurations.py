from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Iterable, List, Mapping


def _split_csv(value: str) -> List[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(frozen=True)
class BaseConfig:
    """Base configuration shared across environments."""

    app_env: str
    debug: bool
    database_url: str
    redis_url: str
    minio_endpoint: str
    minio_bucket: str
    jwt_secret: str
    jwt_refresh_secret: str
    cors_allowed_origins: List[str] = field(default_factory=list)
    log_level: str = "info"
    ml_service_url: str = "http://ml-service:8000"
    rate_limit_window: int = 60
    rate_limit_max: int = 100

    @classmethod
    def from_env(cls, source: Mapping[str, str] | None = None) -> "BaseConfig":
        env = source or os.environ
        cors = _split_csv(env.get("CORS_ALLOWED_ORIGINS", ""))
        redis_url = env.get("REDIS_URL") or f"redis://{env.get('REDIS_HOST', 'redis')}:{env.get('REDIS_PORT', '6379')}/{env.get('REDIS_DB', '0')}"

        return cls(
            app_env=env.get("APP_ENV", "development"),
            debug=env.get("DEBUG", "false").lower() in {"1", "true", "yes"},
            database_url=env.get("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/comedyinsight"),
            redis_url=redis_url,
            minio_endpoint=env.get("AWS_S3_ENDPOINT", "http://minio:9000"),
            minio_bucket=env.get("AWS_S3_BUCKET", "comedyinsight-videos"),
            jwt_secret=env.get("JWT_SECRET", ""),
            jwt_refresh_secret=env.get("JWT_REFRESH_SECRET", ""),
            cors_allowed_origins=cors,
            log_level=env.get("LOG_LEVEL", "info"),
            ml_service_url=env.get("ML_SERVICE_URL", "http://ml-service:8000"),
            rate_limit_window=int(env.get("RATE_LIMIT_WINDOW", "60")),
            rate_limit_max=int(env.get("RATE_LIMIT_MAX", "100")),
        )

    @property
    def is_secure(self) -> bool:
        return bool(self.jwt_secret and len(self.jwt_secret) >= 16)


@dataclass(frozen=True)
class DevelopmentConfig(BaseConfig):
    hot_reload: bool = True
    enable_mock_services: bool = True

    @classmethod
    def from_env(cls, source: Mapping[str, str] | None = None) -> "DevelopmentConfig":
        base = super().from_env(source)
        return cls(
            **base.__dict__,
            hot_reload=True,
            enable_mock_services=True,
            debug=True,
        )


@dataclass(frozen=True)
class ProductionConfig(BaseConfig):
    hot_reload: bool = False
    enable_mock_services: bool = False

    @classmethod
    def from_env(cls, source: Mapping[str, str] | None = None) -> "ProductionConfig":
        base = super().from_env(source)
        return cls(
            **base.__dict__,
            hot_reload=False,
            enable_mock_services=False,
            debug=False,
        )

    @property
    def insecure_settings(self) -> Iterable[str]:
        issues = []
        if not self.is_secure:
            issues.append("JWT_SECRET must be at least 16 characters")
        if self.jwt_refresh_secret == self.jwt_secret:
            issues.append("JWT_REFRESH_SECRET should differ from JWT_SECRET")
        if not self.cors_allowed_origins:
            issues.append("CORS_ALLOWED_ORIGINS should be restricted in production")
        return issues


@dataclass(frozen=True)
class TestingConfig(BaseConfig):
    hot_reload: bool = False
    enable_mock_services: bool = True

    @classmethod
    def from_env(cls, source: Mapping[str, str] | None = None) -> "TestingConfig":
        env = dict(source or os.environ)
        env.setdefault(
            "DATABASE_URL",
            f"postgres://{env.get('POSTGRES_USER', 'postgres')}:{env.get('POSTGRES_PASSWORD', 'postgres')}@{env.get('POSTGRES_HOST', 'postgres')}:{env.get('POSTGRES_PORT', '5432')}/{env.get('POSTGRES_TEST_DB', 'comedyinsight_test')}",
        )
        env.setdefault("REDIS_DB", "15")
        base = super().from_env(env)
        return cls(
            **base.__dict__,
            hot_reload=False,
            enable_mock_services=True,
            debug=False,
        )

