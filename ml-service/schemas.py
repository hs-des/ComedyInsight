from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, validator


class StorageConfig(BaseModel):
    endpoint: HttpUrl
    access_key: str = Field(..., min_length=3, max_length=512)
    secret_key: str = Field(..., min_length=8, max_length=1024)
    bucket: str = Field(..., min_length=3, max_length=255)
    region: Optional[str] = Field(default=None, max_length=128)


class TwilioConfig(BaseModel):
    account_sid: str = Field(..., pattern=r"^AC[a-fA-F0-9]{32}$")
    auth_token: str = Field(..., min_length=16, max_length=128)
    phone_number: str = Field(..., pattern=r"^\+\d{8,15}$")
    verify_service_sid: Optional[str] = Field(default=None, pattern=r"^VA[a-fA-F0-9]{32}$")
    otp_template: str = Field(default="Your ComedyInsight verification code is {{code}}")

    @validator("otp_template")
    def ensure_code_placeholder(cls, value: str) -> str:
        if "{{code}}" not in value:
            raise ValueError("OTP template must include {{code}} placeholder")
        return value


class ApplicationConfig(BaseModel):
    theme: str = Field(default="dark", pattern=r"^(dark|light|system)$")
    language: str = Field(default="en", max_length=8)
    api_timeout: int = Field(default=30, ge=5, le=120)


class PasswordPolicy(BaseModel):
    min_length: int = Field(default=10, ge=6, le=128)
    require_uppercase: bool = True
    require_number: bool = True
    require_special: bool = True


class SecurityConfig(BaseModel):
    jwt_expiry: int = Field(default=900, ge=300, le=86400)
    password_policy: PasswordPolicy = Field(default_factory=PasswordPolicy)


class SettingsPayload(BaseModel):
    storage: StorageConfig
    twilio: TwilioConfig
    application: ApplicationConfig
    security: SecurityConfig


class SettingsResponse(SettingsPayload):
    version: int


class SettingsTestStorageRequest(StorageConfig):
    pass


class SettingsTestTwilioRequest(TwilioConfig):
    phone_number: str = Field(..., pattern=r"^\+\d{8,15}$")


class BackupResponse(BaseModel):
    version: int
    data: SettingsPayload


class RestoreRequest(BaseModel):
    version: Optional[int] = None
    data: SettingsPayload


class SendOTPRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+\d{8,15}$")
    method: str = Field(default="sms", pattern=r"^(sms|voice)$")


class VerifyOTPRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+\d{8,15}$")
    code: str = Field(..., min_length=4, max_length=10)


class ResendOTPRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+\d{8,15}$")
    method: Optional[str] = Field(default=None, pattern=r"^(sms|voice)$")


class VerificationStatusResponse(BaseModel):
    phone_number: str
    verified: bool
    method: str
    attempts: int
    max_attempts: int
    expires_at: Optional[str]
    last_sent_at: Optional[str]


class UploadFileRequest(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=512)
    content_type: str = Field(..., min_length=3, max_length=255)
    size_bytes: int = Field(..., ge=0)
    directory: Optional[str] = Field(default=None, max_length=256)


class UploadFileResponse(BaseModel):
    file_id: str
    upload_url: str
    method: str = "PUT"
    expires_in: int


class FileItem(BaseModel):
    id: str
    file_name: str
    content_type: str
    size_bytes: int
    bucket: str
    key: str
    uploaded_at: str
    preview_url: Optional[str]
    download_url: Optional[str]


class FileListResponse(BaseModel):
    items: List[FileItem]
    page: int
    page_size: int
    total: int


class StorageUsageResponse(BaseModel):
    total_files: int
    total_size: int


class BucketRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=63)
    region: Optional[str] = Field(default=None, max_length=32)


class BucketListResponse(BaseModel):
    buckets: List[str]

