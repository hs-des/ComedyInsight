## Environment Setup Guide

This document describes how to provision and validate environment variables for the ComedyInsight platform across local development, testing, and production deployments.

### 1. Bootstrap a New Environment

1. Copy the example configuration file:

   ```bash
   cp .env.example .env
   ```

2. Review each section in `.env` and adjust values. Important items:

   - **Secrets:** `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `CSRF_COOKIE_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and Twilio credentials must be strong and unique.
   - **Database:** Update `POSTGRES_HOST`, `POSTGRES_PORT`, and `DATABASE_URL` when deploying outside Docker.
   - **Cors:** Restrict `CORS_ALLOWED_ORIGINS` to trusted origins in production.

3. Keep `.env` out of source control. Consider using your secrets manager (Vault, AWS Secrets Manager, Doppler, etc.) for production values.

### 2. Validate the Environment

Use the Python validation script to confirm required variables, data types, and security posture:

```bash
python -m scripts.env.validate_env --env-file .env
```

Add `--strict` to fail on warnings (recommended in CI/CD and production pipelines).

The validator checks:

- Presence of required variables with environment-aware defaults.
- Type coercion (int, bool, URL, CSV lists).
- Minimum lengths for secrets.
- Production hardening rules (distinct JWT secrets, CORS restrictions, etc.).

### 3. Configuration Classes

`scripts/env/configurations.py` defines strongly-typed dataclasses:

- `DevelopmentConfig` – Enables debug mode, hot reload, and mock integrations.
- `ProductionConfig` – Disables debug, enforces secure defaults, surfaces insecure settings.
- `TestingConfig` – Redirects databases/Redis to test instances and enables mocks.

Each class exposes `from_env()` helpers, enabling reuse from scripts or test harnesses.

Example usage:

```python
from scripts.env.configurations import ProductionConfig

config = ProductionConfig.from_env()
if list(config.insecure_settings):
    raise RuntimeError("Fix environment issues before deploying")
```

### 4. Secret Rotation Procedures

- Store canonical secrets in a managed secret store.
- Rotate JWT and session secrets on a set cadence (e.g., quarterly) or after security incidents.
- When rotating, update `.env` (or secret manager) and redeploy API instances. For JWTs, consider overlapping validity windows to avoid mass logouts.
- Keep fallback credentials (previous versions) only as long as needed to support key rotation.

### 5. Environment-specific Recommendations

| Environment  | Notes                                                                 |
|--------------|-----------------------------------------------------------------------|
| Development  | Use defaults, enable `DEBUG` and mock services, keep secrets non-empty but simple. |
| Testing      | Separate databases (`POSTGRES_TEST_DB`), disable CORS restrictions, use ephemeral buckets. |
| Production   | Enforce HTTPS, rotate secrets, scope S3 credentials to single bucket, restrict `CORS_ALLOWED_ORIGINS`, disable mock services. |

### 6. CI/CD Integration

- Run `python -m scripts.env.validate_env --strict` as part of pipeline checks.
- Block deployment when validation fails (missing secrets, insecure defaults).
- Generate environment-specific configs (e.g., `APP_ENV=production`) before running the validator.
- Set `SETTINGS_ENCRYPTION_KEY` (32-byte base64) and `ADMIN_API_TOKEN` for the FastAPI configuration service before deploying. Never reuse encryption keys across environments.
- Define OTP variables (`OTP_CODE_LENGTH`, `OTP_TTL_SECONDS`, `OTP_RESEND_INTERVAL_SECONDS`, `OTP_RATE_LIMIT_PER_HOUR`, `OTP_MAX_ATTEMPTS`, `OTP_DEFAULT_METHOD`) to match your security policy.

### 7. Additional Tips

- Use `.env.production`, `.env.testing`, etc., and load the appropriate file based on the deployment target. The validator supports any input filename via `--env-file`.
- For containerized deployments, mirror variables into your orchestration system (Docker Compose, Kubernetes secrets, etc.).
- Document owner responsibility for each secret (e.g., DevOps for database credentials, product team for third-party APIs).

By following this workflow, environments remain reproducible, secure, and self-documented. Ensure the `.env` file (or secret manager entries) stays synchronized with the schema in `scripts/env/validate_env.py`.

