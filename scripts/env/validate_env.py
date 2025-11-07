from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, Tuple

from .configurations import DevelopmentConfig, ProductionConfig, TestingConfig


SchemaEntry = Dict[str, Any]


SCHEMA: Dict[str, SchemaEntry] = {
    # Core runtime
    "APP_ENV": {"type": "str", "required": True, "choices": {"development", "production", "testing"}},
    "NODE_ENV": {"type": "str", "default": "development"},
    "DEBUG": {"type": "bool", "default": False},
    "PUBLIC_URL": {"type": "url", "default": "http://localhost:3000"},
    # Database
    "DATABASE_URL": {"type": "url", "required": True},
    "POSTGRES_HOST": {"type": "str", "default": "localhost"},
    "POSTGRES_PORT": {"type": "int", "default": 5432},
    "POSTGRES_USER": {"type": "str", "default": "postgres"},
    "POSTGRES_PASSWORD": {"type": "secret", "required": True},
    "POSTGRES_DB": {"type": "str", "default": "comedyinsight"},
    "POSTGRES_TEST_DB": {"type": "str", "default": "comedyinsight_test"},
    # Redis
    "REDIS_URL": {"type": "url", "optional": True},
    "REDIS_HOST": {"type": "str", "default": "redis"},
    "REDIS_PORT": {"type": "int", "default": 6379},
    "REDIS_PASSWORD": {"type": "secret", "optional": True},
    "REDIS_DB": {"type": "int", "default": 0},
    # MinIO / S3
    "AWS_S3_ENDPOINT": {"type": "url", "default": "http://minio:9000"},
    "AWS_S3_BUCKET": {"type": "str", "required": True},
    "AWS_ACCESS_KEY_ID": {"type": "secret", "required": True},
    "AWS_SECRET_ACCESS_KEY": {"type": "secret", "required": True},
    "AWS_S3_REGION": {"type": "str", "default": "us-east-1"},
    # Twilio
    "TWILIO_ACCOUNT_SID": {"type": "str", "optional": True},
    "TWILIO_AUTH_TOKEN": {"type": "secret", "optional": True},
    "TWILIO_FROM_NUMBER": {"type": "str", "optional": True},
    "TWILIO_VERIFY_SERVICE_SID": {"type": "str", "optional": True},
    # JWT / Security
    "JWT_SECRET": {"type": "secret", "required": True, "min_length": 16},
    "JWT_REFRESH_SECRET": {"type": "secret", "required": True, "min_length": 16},
    "JWT_ACCESS_TOKEN_TTL": {"type": "int", "default": 900},
    "JWT_REFRESH_TOKEN_TTL": {"type": "int", "default": 1209600},
    "PASSWORD_RESET_TOKEN_TTL": {"type": "int", "default": 3600},
    "RATE_LIMIT_WINDOW": {"type": "int", "default": 60},
    "RATE_LIMIT_MAX": {"type": "int", "default": 100},
    "CORS_ALLOWED_ORIGINS": {"type": "csv", "default": "http://localhost:3000"},
    # ML
    "ML_SERVICE_URL": {"type": "url", "default": "http://ml-service:8000"},
    "ML_MODEL_NAME": {"type": "str", "default": "recommendation-v1"},
    "ML_MODEL_VERSION": {"type": "str", "default": "latest"},
    "ML_REQUEST_TIMEOUT": {"type": "int", "default": 5},
    # Frontend
    "VITE_API_BASE_URL": {"type": "url", "default": "http://localhost:3000"},
    "EXPO_PUBLIC_API_BASE_URL": {"type": "url", "default": "http://localhost:3000"},
    "DASHBOARD_URL": {"type": "url", "default": "http://localhost:4173"},
    # Observability
    "LOG_LEVEL": {"type": "str", "default": "info"},
    "SENTRY_DSN": {"type": "url", "optional": True},
    "ENABLE_METRICS": {"type": "bool", "default": False},
}


def parse_env_file(path: Path) -> Dict[str, str]:
    data: Dict[str, str] = {}
    if not path.exists():
        return data
    for line in path.read_text(encoding="utf8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip().strip('"').strip("'")
    return data


def coerce(value: str, entry: SchemaEntry) -> Tuple[bool, Any]:
    type_name = entry.get("type", "str")
    try:
        if type_name == "int":
            return True, int(value)
        if type_name == "bool":
            lowered = value.lower()
            if lowered in {"1", "true", "yes", "on"}:
                return True, True
            if lowered in {"0", "false", "no", "off"}:
                return True, False
            raise ValueError("expected boolean")
        if type_name == "url":
            if "://" not in value:
                raise ValueError("expected URL")
            return True, value
        if type_name == "csv":
            items = [item.strip() for item in value.split(",") if item.strip()]
            return True, items
        # secret / str fallback
        if entry.get("min_length") and len(value) < entry["min_length"]:
            raise ValueError(f"minimum length {entry['min_length']}")
        return True, value
    except ValueError as exc:
        return False, str(exc)


def validate(env: Dict[str, str]) -> Tuple[int, Iterable[str], Iterable[str]]:
    errors = []
    warnings = []
    app_env = env.get("APP_ENV", "development").lower()

    for key, entry in SCHEMA.items():
        present = key in env and env[key] != ""
        required = entry.get("required", False)
        optional = entry.get("optional", False)
        if not present:
            if required and not optional:
                if app_env == "development" and "default" in entry:
                    warnings.append(f"{key} missing, using development default '{entry['default']}'")
                    env[key] = str(entry["default"])
                else:
                    errors.append(f"{key} is required")
                    continue
            elif "default" in entry:
                env[key] = str(entry["default"])
            else:
                continue

        if "choices" in entry and env[key].lower() not in entry["choices"]:
            errors.append(f"{key} must be one of {sorted(entry['choices'])}")
            continue

        ok, result = coerce(env[key], entry)
        if not ok:
            errors.append(f"{key}: invalid value '{env[key]}' ({result})")
        else:
            env[key] = str(result) if not isinstance(result, list) else env[key]

    if app_env == "production":
        config = ProductionConfig.from_env(env)
        warnings.extend(config.insecure_settings)
    elif app_env == "testing":
        TestingConfig.from_env(env)
    else:
        DevelopmentConfig.from_env(env)

    return len(errors), errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate ComedyInsight environment variables.")
    parser.add_argument("--env-file", default=".env", help="Path to .env file (default: .env)")
    parser.add_argument("--strict", action="store_true", help="Fail on warnings as well as errors")
    args = parser.parse_args()

    env_file = Path(args.env_file)
    file_values = parse_env_file(env_file)
    combined = {**file_values, **os.environ}

    error_count, errors, warnings = validate(combined)

    if errors:
        print("❌ Environment validation failed:")
        for err in errors:
            print(f"  - {err}")
    else:
        print("✅ Required variables present.")

    if warnings:
        print("⚠️  Warnings:")
        for warn in warnings:
            print(f"  - {warn}")

    if error_count or (args.strict and warnings):
        return 1
    print("Environment looks good!")
    return 0


if __name__ == "__main__":
    sys.exit(main())

