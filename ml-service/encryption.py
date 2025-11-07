from __future__ import annotations

import base64
from functools import lru_cache
from typing import Optional

from cryptography.fernet import Fernet

from .config import get_settings


@lru_cache
def _get_fernet() -> Fernet:
    settings = get_settings()
    key = settings.encryption_key
    try:
        # Accept key already base64 encoded or raw 32 bytes
        if len(key) == 32:
            key_bytes = base64.urlsafe_b64encode(key.encode())
        else:
            key_bytes = key.encode()
        return Fernet(key_bytes)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("Invalid SETTINGS_ENCRYPTION_KEY provided") from exc


def encrypt_value(value: Optional[str]) -> Optional[str]:
    if value is None or value == "":
        return value
    f = _get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_value(value: Optional[str]) -> Optional[str]:
    if value is None or value == "":
        return value
    f = _get_fernet()
    return f.decrypt(value.encode()).decode()

