from __future__ import annotations

from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, HttpUrl, validator, ConfigDict
from uuid import UUID
from datetime import datetime, date


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


class Pagination(BaseModel):
    total: int
    page: int
    page_size: int


class ArtistBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    bio: Optional[str] = None
    profile_image_url: Optional[str] = Field(default=None, max_length=512)
    is_active: Optional[bool] = True
    is_featured: Optional[bool] = False


class ArtistCreate(ArtistBase):
    pass


class ArtistUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    bio: Optional[str] = None
    profile_image_url: Optional[str] = Field(default=None, max_length=512)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class ArtistResponse(ArtistBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SubtitleCreate(BaseModel):
    language: str = Field(..., max_length=16)
    label: Optional[str] = Field(default=None, max_length=128)
    file_url: str = Field(..., max_length=1024)


class SubtitleResponse(SubtitleCreate):
    id: UUID
    video_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SubtitleCreateRequest(SubtitleCreate):
    video_id: UUID


class SubtitleUpdateRequest(BaseModel):
    label: Optional[str] = Field(default=None, max_length=128)
    file_url: Optional[str] = Field(default=None, max_length=1024)


class VideoBase(BaseModel):
    title: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(default=None, max_length=512)
    video_url: Optional[str] = Field(default=None, max_length=1024)
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    status: str = Field(default="draft", max_length=64)
    release_date: Optional[date] = None
    is_featured: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VideoCreate(VideoBase):
    artist_ids: List[UUID] = Field(default_factory=list)
    category_ids: List[UUID] = Field(default_factory=list)
    subtitles: List[SubtitleCreate] = Field(default_factory=list)


class VideoUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    slug: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(default=None, max_length=512)
    video_url: Optional[str] = Field(default=None, max_length=1024)
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = Field(default=None, max_length=64)
    release_date: Optional[date] = None
    is_featured: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None
    artist_ids: Optional[List[UUID]] = None
    category_ids: Optional[List[UUID]] = None
    subtitles: Optional[List[SubtitleCreate]] = None


class VideoResponse(VideoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    artists: List[ArtistResponse]
    categories: List[CategoryResponse]
    subtitles: List[SubtitleResponse]
    model_config = ConfigDict(from_attributes=True)


class SubscriptionPlanBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    price_cents: int = Field(..., ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    billing_interval: str = Field(default="monthly", max_length=32)
    trial_days: int = Field(default=0, ge=0)
    is_active: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass


class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserSubscriptionRequest(BaseModel):
    plan_id: Optional[UUID] = None
    status: str = Field(default="active", max_length=32)
    expires_at: Optional[datetime] = None
    renewal_price_cents: Optional[int] = Field(default=None, ge=0)


class UserSubscriptionResponse(UserSubscriptionRequest):
    id: UUID
    user_id: UUID
    started_at: datetime
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ServiceSettingCreate(BaseModel):
    service: str = Field(..., max_length=128)
    value: Dict[str, Any] = Field(default_factory=dict)


class ServiceSettingResponse(ServiceSettingCreate):
    id: UUID
    updated_by: Optional[str]
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DirectUploadResponse(BaseModel):
    file_id: UUID
    file_name: str
    key: str
    content_type: str
    size_bytes: int
    download_url: str
    object_url: str
    model_config = ConfigDict(from_attributes=True)


class ArtistListResponse(BaseModel):
    items: List[ArtistResponse]
    pagination: Pagination


class CategoryListResponse(BaseModel):
    items: List[CategoryResponse]
    pagination: Pagination


class VideoListResponse(BaseModel):
    items: List[VideoResponse]
    pagination: Pagination


class UserSummary(BaseModel):
    id: UUID
    email: Optional[str]
    full_name: Optional[str]
    created_at: datetime
    is_active: Optional[bool]
    is_verified: Optional[bool]
    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    items: List[UserSummary]
    pagination: Pagination


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None


class SettingsConnectionTestRequest(BaseModel):
    service: str = Field(..., max_length=64)
    payload: Dict[str, Any] = Field(default_factory=dict)

