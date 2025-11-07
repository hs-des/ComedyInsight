from __future__ import annotations

import hashlib
import secrets
import string


def generate_code(length: int = 6) -> str:
    digits = string.digits
    return ''.join(secrets.choice(digits) for _ in range(length))


def generate_salt() -> str:
    return secrets.token_hex(16)


def hash_code(code: str, salt: str) -> str:
    return hashlib.sha256(f"{salt}:{code}".encode()).hexdigest()


def verify_code(code: str, salt: str, expected_hash: str) -> bool:
    return hash_code(code, salt) == expected_hash

